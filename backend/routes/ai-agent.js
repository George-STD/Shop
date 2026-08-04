const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { GoogleGenAI } = require('@google/genai');

const { protect, admin, adminLimiter } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// Models
const AiChatSession = require('../models/AiChatSession');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const Order = require('../models/Order');

router.use(protect);
router.use(admin);
router.use(adminLimiter);

let _aiClient = null;
function getAiClient() {
  if (!_aiClient) {
    _aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _aiClient;
}

const { MODEL_TIERS, getModelStatus, recordSuccess, markRpmExhausted } = require('../utils/geminiModelManager');

const MODELS_MAP = {
  Product,
  Category,
  User,
  Order
};

// Helper to recursively convert valid 24-hex string IDs into mongoose.Types.ObjectId
const castObjectIds = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(castObjectIds);
  
  const result = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string' && mongoose.Types.ObjectId.isValid(val) && val.length === 24) {
      result[key] = new mongoose.Types.ObjectId(val);
    } else if (typeof val === 'object' && val !== null) {
      result[key] = castObjectIds(val);
    } else {
      result[key] = val;
    }
  }
  return result;
};

// ============================================================================
// SYSTEM PROMPT & TOOLS
// ============================================================================

const systemInstruction = `
أنت المساعد الذكي الخاص بمدير متجر الهدايا (Admin).
مهمتك مساعدة المدير في تحليل البيانات واقتراح التعديلات عليها بناءً على طلبه.
أنت تملك صلاحيات كاملة على الجداول التالية: Product, User, Order, Category.
ولكن لا يمكنك تنفيذ أي تعديل مباشرة، بل تقترح التعديل وينتظر موافقة الأدمن.

مخطط الحقول الحقيقية في قاعدة البيانات (Schema Fields):
1. Product (المنتجات):
   - canBeAddedToBox: Boolean (قابل للإضافة لبوكس الهدايا - استخدم هذا الحقل دائماً لشرط أو تعديل البوكس! لا تستخدم isBoxable أو حقول غير موجودة)
   - boxDiscount: Number (نسبة الخصم داخل البوكس)
   - isCustomBox: Boolean (بوكس هدايا فارغ قابل للتخصيص)
   - name: String (اسم المنتج)
   - price: Number (السعر الأساسي)
   - oldPrice: Number
   - discount: Number (نسبة الخصم)
   - stock: Number (الكمية بالمخزون)
   - category: Array of Category ObjectIds (مصفوفة من المعرفات الحقيقية للفئات)
   - isقواعد صارمة ومهمة جداً للعمليات:
1. عند التعامل مع فئات المنتجات (category في Product):
   - حقل category في المنتجات يحوي _id الفئة المكون من 24 حرفاً (Category ObjectId).
   - إذا طلب الأدمن تعديل فئة معينة (مثال: نقل منتجات إلى فئة "T-Shirt" أو حذف فئة "Women"):
     * يجب أولاً استدعاء searchDatabase على جدول Category بشرط {"name": {"$regex": "T-Shirt", "$options": "i"}} لجلب الـ _id الحقيقي للفئة!
     * ممنوع منعاً باتاً تخمين _id الفئة من عندك أو وضع اسم الفئة كنص في $pull أو $push أو $set.
     * بعد جلب _id الفئة الحقيقي (مثال "65a123..."), استخدم: {"$push": {"category": "65a123..."}} أو {"$set": {"category": ["65a123..."]}}.

2. عند طلب الأدمن تعديل مستندات:
   - يجب أن تجلب الـ _id الحقيقي المكون من 24 خانة لكل مستند عبر أداة searchDatabase أولاً!
   - ممنوع منعاً باتاً استخدام أرقام تسلسلية ("1", "2", "3") كـ documentIds في أداة proposeDatabaseUpdate.

3. الاستدعاء الفوري لأداة اقتراح التعديل (proposeDatabaseUpdate) - هام جداً جداً:
   - عندما يطلب منك الأدمن أي تعديل على المستندات (إضافة/حذف فئات، تغيير أسعار، خصومات، إلخ)، يجب عليك فوراً العثور على المنتجات عبر searchDatabase ثم استدعاء أداة proposeDatabaseUpdate فوراً في نفس الجلسة!
   - يمنع منعاً باتاً كتابة أي نص يسأل الأدمن أسئلة مثل "هل أرسل طلب التعديل؟" أو "هل تريد مني إنشاء كارت التعديل؟".
   - لا تسأل الأدمن عن الموافقة نصياً لأن واجهة الموقع تعتمد على استدعاء أداة proposeDatabaseUpdate لعرض كارت التعديل وبداخله زر (موافقة وتنفيذ) للأدمن ليضغط عليه بنفسه!

4. صيغة التعديلات (updateJson):
   - يجب استخدام أوامر MongoDB مثل:
     * {"$set": {"canBeAddedToBox": true}}
     * {"$set": {"category": ["CATEGORY_OBJECT_ID"]}}
     * {"$pull": {"category": "CATEGORY_OBJECT_ID"}}
     * {"$push": {"category": "CATEGORY_OBJECT_ID"}}
     * {"$inc": {"stock": 10}}
   - التأكد من أن مفاتيح التعديل تبدأ بـ $ وأن أنواع البيانات صحيحة.

5. عند تعامل الأدمن مع قوالب سابقة (مثال: "خلي المنتجات دي..." أو "تعديل هذه القائمة"):
   - راجع قائمة الـ ObjectIDs المسترجعة السابقة المتاحة في ملاحظات النظام [System Note].
   - إذا أراد الأدمن نقل تلك المنتجات لفئة معينة (مثال: "في فئة T-Shirt فقط"):
     * ابحث أولاً عن _id الفئة الحقيقية عبر searchDatabase على Category.
     * استدعِ أداة proposeDatabaseUpdate فوراً مستخدماً قائمة الـ documentIds وممرراً التحديث {"$set": {"category": ["CATEGORY_OBJECT_ID"]}}.
`;

const tools = [
  {
    functionDeclarations: [
      {
        name: 'searchDatabase',
        description: 'البحث في قاعدة البيانات واسترجاع المستندات التي تتطابق مع الشروط بما فيها الـ _id الحقيقي.',
        parameters: {
          type: 'OBJECT',
          properties: {
            collectionName: { 
              type: 'STRING', 
              description: 'اسم الجدول (Product, User, Order, Category)' 
            },
            filterJson: { 
              type: 'STRING', 
              description: 'استعلام البحث بصيغة JSON (مثال: {"canBeAddedToBox": false} أو {"name": {"$regex": "شوكولاتة"}}). اتركها {} لجلب الكل.' 
            },
            limit: { 
              type: 'INTEGER', 
              description: 'الحد الأقصى لعدد النتائج (افتراضي 20)' 
            }
          },
          required: ['collectionName', 'filterJson']
        }
      },
      {
        name: 'proposeDatabaseUpdate',
        description: 'اقتراح تعديلات على مجموعة من المستندات. يجب أن تحتوي documentIds على الـ _id الحقيقية (24 hex characters) المسترجعة من searchDatabase.',
        parameters: {
          type: 'OBJECT',
          properties: {
            collectionName: { 
              type: 'STRING', 
              description: 'اسم الجدول (Product, User, Order, Category)' 
            },
            documentIds: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'قائمة بـ MongoDB ObjectIDs الحقيقية المسترجعة من searchDatabase (مثال: ["65f...", "65a..."]). لا تستخدم أرقام مثل ["1", "2"].'
            },
            updateJson: {
              type: 'STRING',
              description: 'التعديلات المقترحة بصيغة JSON ويجب استخدام أوامر MongoDB مثل $set, $pull, $inc (مثال: {"$set": {"canBeAddedToBox": true}})'
            },
            reasoning: { 
              type: 'STRING', 
              description: 'شرح قصير وواضح للأدمن يوضح سبب هذا التعديل.' 
            }
          },
          required: ['collectionName', 'documentIds', 'updateJson', 'reasoning']
        }
      }
    ]
  }
];

// Helper to safely parse JSON from Gemini
const safeParse = (str) => {
  try { return JSON.parse(str); } catch (e) { return {}; }
};

// ============================================================================
// @route   GET /api/admin/ai-agent/sessions
// @desc    Get all chat sessions for the current admin
// ============================================================================
router.get('/sessions', asyncHandler(async (req, res) => {
  const sessions = await AiChatSession.find({ adminId: req.user._id })
    .select('_id title updatedAt')
    .sort({ updatedAt: -1 });
  res.json({ success: true, data: sessions });
}));

// ============================================================================
// @route   GET /api/admin/ai-agent/sessions/:id
// @desc    Get a specific chat session
// ============================================================================
router.get('/sessions/:id', asyncHandler(async (req, res) => {
  const session = await AiChatSession.findOne({ _id: req.params.id, adminId: req.user._id });
  if (!session) return res.status(404).json({ success: false, message: 'المحادثة غير موجودة' });
  res.json({ success: true, data: session });
}));

// ============================================================================
// @route   POST /api/admin/ai-agent/sessions
// @desc    Create a new chat session
// ============================================================================
router.post('/sessions', asyncHandler(async (req, res) => {
  const session = await AiChatSession.create({
    adminId: req.user._id,
    title: req.body.title || 'محادثة جديدة',
    messages: []
  });
  res.json({ success: true, data: session });
}));

// ============================================================================
// @route   DELETE /api/admin/ai-agent/sessions/:id
// @desc    Delete a specific chat session
// ============================================================================
router.delete('/sessions/:id', asyncHandler(async (req, res) => {
  const session = await AiChatSession.findOneAndDelete({ _id: req.params.id, adminId: req.user._id });
  if (!session) return res.status(404).json({ success: false, message: 'المحادثة غير موجودة' });
  res.json({ success: true, message: 'تم حذف المحادثة بنجاح' });
}));

// ============================================================================
// @route   POST /api/admin/ai-agent/sessions/:id/chat
// @desc    Send a message to AI Agent
// ============================================================================
router.post('/sessions/:id/chat', asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'الرسالة مطلوبة' });

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ success: false, message: 'مفتاح GEMINI_API_KEY غير موجود في إعدادات السيرفر.' });
  }

  let session = await AiChatSession.findOne({ _id: req.params.id, adminId: req.user._id });
  if (!session) return res.status(404).json({ success: false, message: 'المحادثة غير موجودة' });

  // Update title if it's the first message
  if (session.messages.length === 0) {
    session.title = message.length > 30 ? message.substring(0, 30) + '...' : message;
  }

  // Save user message
  session.messages.push({ role: 'user', text: message });
  await session.save();

  const ai = getAiClient();
  
  // Construct Gemini history from session messages
  const history = session.messages
    .filter(msg => msg.text || msg.proposedAction || msg.searchContext)
    .map(msg => {
      let contentText = msg.text || '';
      if (msg.searchContext && msg.searchContext.items && msg.searchContext.items.length > 0) {
        contentText += `\n[System Note: Document IDs and names retrieved in search for '${msg.searchContext.collectionName}': ${JSON.stringify(msg.searchContext.items)}]`;
      }
      if (msg.proposedAction) {
        contentText += `\n[System Note: The model proposed an action on collection '${msg.proposedAction.collectionName}' for documentIds [${msg.proposedAction.documentIds.join(', ')}]. User is reviewing it.]`;
      }
      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: contentText.trim() }]
      };
    });
    
  // Pop the last user message because we pass it directly to sendMessage
  history.pop();

  let finalResult = null;
  let proposedAction = null;
  let searchContext = null;
  let finalResponseText = null;
  let currentModelIndex = 0;

  // Try models with full-turn fallback
  while (currentModelIndex < MODEL_TIERS.length) {
    const tier = MODEL_TIERS[currentModelIndex];
    const status = getModelStatus(tier);
    if (!status.available) {
      currentModelIndex++;
      continue;
    }

    const chatSession = ai.chats.create({
      model: tier.realId || tier.id,
      config: { systemInstruction, tools, temperature: 0.1 },
      history
    });

    try {
      // 1. Send initial user message
      const timeoutPromise1 = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Gemini API Timeout')), 45000)
      );
      let result = await Promise.race([
        chatSession.sendMessage({ message }),
        timeoutPromise1
      ]);

      let functionCalls = result.functionCalls;
      finalResponseText = result.text;

      // 2. Tool loop (max 4 iterations)
      let iteration = 0;
      while (functionCalls && functionCalls.length > 0 && iteration < 4) {
        const toolCall = functionCalls[0];
        const name = toolCall.name;
        const args = toolCall.args;
        let toolResult;

        try {
          const Model = MODELS_MAP[args.collectionName];
          if (!Model) throw new Error(`Collection ${args.collectionName || name} not supported`);

          if (name === 'searchDatabase') {
            const filter = safeParse(args.filterJson);
            // Sanitize filter to remove dangerous operators like $where, $function, $accumulator
            const sanitizeFilter = (obj) => {
              if (!obj || typeof obj !== 'object') return obj;
              for (const key of Object.keys(obj)) {
                if (key === '$where' || key === '$function' || key === '$accumulator') {
                  delete obj[key];
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                  sanitizeFilter(obj[key]);
                }
              }
              return obj;
            };
            const cleanFilter = sanitizeFilter(filter);
            const castFilter = castObjectIds(cleanFilter);
            const limit = Math.min(Math.max(1, Number(args.limit) || 20), 50);
            
            // Dynamic selection based on collection
            let selectStr = '';
            if (args.collectionName === 'Product') selectStr = '_id name price stock isActive canBeAddedToBox isCustomBox boxDiscount category';
            else if (args.collectionName === 'User') selectStr = '_id firstName lastName email role isActive';
            else if (args.collectionName === 'Order') selectStr = '_id orderNumber status total user';
            else if (args.collectionName === 'Category') selectStr = '_id name image isActive slug';

            const data = await Model.find(castFilter).select(selectStr).limit(limit).lean();
            toolResult = { data };

            if (data && data.length > 0) {
              searchContext = {
                collectionName: args.collectionName,
                items: data.slice(0, 30).map(d => ({
                  _id: d._id.toString(),
                  name: d.name || d.firstName || d.orderNumber || d.slug || 'عنصر'
                }))
              };
            }
            iteration++;

          } else if (name === 'proposeDatabaseUpdate') {
            const updates = safeParse(args.updateJson);
            
            // Block sensitive fields from being proposed via AI
            const FORBIDDEN_FIELDS = ['password', 'role', 'emailVerificationCode', 'emailVerificationExpires', 'resetPasswordToken', 'resetPasswordExpires'];
            const containsForbiddenField = (obj) => {
              if (!obj || typeof obj !== 'object') return false;
              for (const key of Object.keys(obj)) {
                if (FORBIDDEN_FIELDS.includes(key)) return true;
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                  if (containsForbiddenField(obj[key])) return true;
                }
              }
              return false;
            };

            if (containsForbiddenField(updates)) {
              toolResult = { error: 'PROHIBITED_FIELD: Cannot update sensitive account credentials or user roles via AI Agent.' };
              iteration++;
            } else {
              // Fetch previews with full relevant details for the detailed table
              let selectStr = '';
              if (args.collectionName === 'Product') selectStr = '_id name images.url isActive price stock category canBeAddedToBox';
              else if (args.collectionName === 'User') selectStr = '_id firstName lastName email role avatar isActive';
              else if (args.collectionName === 'Order') selectStr = '_id orderNumber status total user';
              else if (args.collectionName === 'Category') selectStr = '_id name image isActive slug';

              const affectedDocuments = await Model.find({ _id: { $in: args.documentIds } }).select(selectStr).lean();
              
              if (!affectedDocuments || affectedDocuments.length === 0) {
                toolResult = {
                  error: `INVALID_DOCUMENT_IDS: None of the documentIds provided [${args.documentIds.slice(0, 5).join(', ')}...] were found in ${args.collectionName}. You MUST call 'searchDatabase' first to retrieve the real 24-character hexadecimal MongoDB '_id's before proposing updates. Do NOT use numbers ('1', '2') or names as documentIds.`
                };
                iteration++;
              } else {
                const validIds = affectedDocuments.map(doc => doc._id.toString());
                proposedAction = {
                  collectionName: args.collectionName,
                  documentIds: validIds,
                  updates,
                  reasoning: args.reasoning,
                  preview: affectedDocuments
                };
                
                toolResult = { status: 'PROPOSAL_RECEIVED', message: 'User is reviewing the proposal. Stop execution.' };
                break;
              }
            }
          } else {
            toolResult = { error: `Tool ${name} not supported` };
          }
        } catch (dbErr) {
          toolResult = { error: dbErr.message };
        }

        const timeoutPromise2 = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Gemini API Timeout')), 15000)
        );
        result = await Promise.race([
          chatSession.sendMessage({ message: [{ functionResponse: { name, response: toolResult } }] }),
          timeoutPromise2
        ]);
        functionCalls = result.functionCalls;
        if (result.text) finalResponseText = result.text;
        iteration++;
      }

      recordSuccess(tier.id);
      finalResult = result;
      break; // Success, exit model fallback loop

    } catch (error) {
      console.error(`Agent chat error with model ${tier.id}:`, error.message);
      const is429 = error.status === 429 || error.message?.includes('429') || error.message?.toLowerCase().includes('quota') || error.status === 503;
      if (is429) markRpmExhausted(tier.id, tier);
      currentModelIndex++;
    }
  }

  if (!finalResult && !proposedAction) {
    return res.status(500).json({ success: false, message: 'حدث خطأ في الاتصال بالذكاء الاصطناعي أو انتهى وقت الاتصال.' });
  }

  // Ensure text is never empty
  let defaultText = 'لقد قمت بمعالجة طلبك.';
  if (proposedAction) {
    defaultText = 'لقد قمت بإعداد بطاقة التعديل المطلوبة. يرجى مراجعة المنتجات والتغييرات أدناه والضغط على زر "موافقة وتنفيذ" لإتمام العملية.';
  } else if (searchContext && searchContext.items && searchContext.items.length > 0) {
    defaultText = `تم استرجاع ${searchContext.items.length} عنصر من قاعدة البيانات.`;
  }

  // Save model response
  const modelMsg = {
    role: 'model',
    text: (finalResponseText && finalResponseText.trim()) ? finalResponseText.trim() : defaultText,
    searchContext,
    proposedAction
  };
  session.messages.push(modelMsg);
  await session.save();

  // Return the newly added message object with its generated ID
  const savedModelMsg = session.messages[session.messages.length - 1];

  res.json({
    success: true,
    data: savedModelMsg
  });
}));

// ============================================================================
// @route   POST /api/admin/ai-agent/execute
// @desc    Execute a proposed action
// ============================================================================
router.post('/execute', asyncHandler(async (req, res) => {
  const { sessionId, messageId, collectionName, documentIds, updates } = req.body;

  if (!collectionName || !documentIds || !updates) {
    return res.status(400).json({ success: false, message: 'بيانات غير مكتملة للتنفيذ' });
  }

  const Model = MODELS_MAP[collectionName];
  if (!Model) {
    return res.status(400).json({ success: false, message: 'جدول غير مدعوم' });
  }

  // Ensure prohibited fields cannot be updated via AI Agent execute route
  const FORBIDDEN_FIELDS = ['password', 'role', 'emailVerificationCode', 'emailVerificationExpires', 'resetPasswordToken', 'resetPasswordExpires'];
  const containsForbiddenField = (obj) => {
    if (!obj || typeof obj !== 'object') return false;
    for (const key of Object.keys(obj)) {
      if (FORBIDDEN_FIELDS.includes(key)) return true;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (containsForbiddenField(obj[key])) return true;
      }
    }
    return false;
  };

  if (containsForbiddenField(updates)) {
    return res.status(400).json({ success: false, message: 'لا يمكن تعديل الحقول الحساسة (كلمة المرور، الدور، التوكنات) عبر AI Agent.' });
  }

  // Ensure updates is using MongoDB operators safely.
  // If it doesn't contain any $ operator, we assume it's just raw fields and wrap it in $set for backwards compatibility
  const hasOperator = Object.keys(updates).some(k => k.startsWith('$'));
  let finalUpdate = hasOperator ? updates : { $set: updates };
  
  // Convert any string ObjectIDs inside updates ($pull, $push, etc.) to real mongoose.Types.ObjectId
  finalUpdate = castObjectIds(finalUpdate);

  const validDocIds = documentIds.map(id => 
    mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id
  );

  // Execute update
  const result = await Model.updateMany(
    { _id: { $in: validDocIds } },
    finalUpdate
  );

  // Mark message as executed
  if (sessionId && messageId) {
    await AiChatSession.findOneAndUpdate(
      { _id: sessionId, 'messages._id': messageId },
      { $set: { 'messages.$.executed': true } }
    );
  }

  const isZero = result.modifiedCount === 0;
  const statusMsg = isZero 
    ? 'لم يتم تعديل أي عنصر لأن القيم المراد تعديلها مطابقة بالفعل أو المعرفات غير موجودة بالمنتجات.'
    : `تم تعديل ${result.modifiedCount} عنصر بنجاح`;

  res.json({
    success: true,
    message: statusMsg,
    modifiedCount: result.modifiedCount
  });
}));

// ============================================================================
// @route   POST /api/admin/ai-agent/reject
// @desc    Reject a proposed action
// ============================================================================
router.post('/reject', asyncHandler(async (req, res) => {
  const { sessionId, messageId } = req.body;

  if (sessionId && messageId) {
    await AiChatSession.findOneAndUpdate(
      { _id: sessionId, 'messages._id': messageId },
      { $set: { 'messages.$.executed': 'rejected' } }
    );
  }

  res.json({ success: true, message: 'تم الإلغاء' });
}));

module.exports = router;
