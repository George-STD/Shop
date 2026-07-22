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

const { MODEL_TIERS } = require('../utils/geminiModelManager');

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
   - isActive: Boolean (نشط/مفعل)
   - isFeatured: Boolean (مميز)
   - isNewArrival: Boolean (وصل حديثاً)
   - isBestseller: Boolean (الأكثر مبيعاً)

2. User (المستخدمين):
   - firstName, lastName, email, role ('user' | 'admin'), isActive

3. Order (الطلبات):
   - orderNumber, status ('pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'), total, isPaid

4. Category (الفئات):
   - _id, name, slug, isActive, showInBox

قواعد صارمة ومهمة جداً للعمليات:
1. عند التعامل مع فئات المنتجات (category في Product):
   - حقل category في المنتجات يحوي _id الفئة المكون من 24 حرفاً (Category ObjectId).
   - إذا طلب الأدمن حذف فئة معينة (مثال: حذف فئة "Women" أو "Men"):
     * يجب أولاً استدعاء searchDatabase على جدول Category بشرط {"name": {"$regex": "Women", "$options": "i"}} لجلب الـ _id الحقيقي للفئة!
     * ممنوع منعاً باتاً تخمين _id الفئة من عندك أو وضع اسم الفئة كنص في $pull.
     * بعد جلب _id الفئة الحقيقي (مثال "65a123..."), استخدم: {"$pull": {"category": "65a123..."}}.

2. عند طلب الأدمن تعديل مستندات:
   - يجب أن تجلب الـ _id الحقيقي المكون من 24 خانة لكل مستند عبر أداة searchDatabase أولاً!
   - ممنوع منعاً باتاً استخدام أرقام تسلسلية ("1", "2", "3") كـ documentIds في أداة proposeDatabaseUpdate.

3. صيغة التعديلات (updateJson):
   - يجب استخدام أوامر MongoDB مثل:
     * {"$set": {"canBeAddedToBox": true}}
     * {"$pull": {"category": "CATEGORY_OBJECT_ID"}}
     * {"$push": {"category": "CATEGORY_OBJECT_ID"}}
     * {"$inc": {"stock": 10}}
   - التأكد من أن مفاتيح التعديل تبدأ بـ $ وأن أنواع البيانات صحيحة.
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
  res.status(201).json({ success: true, data: session });
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
    .filter(msg => msg.text || msg.proposedAction)
    .map(msg => {
      let contentText = msg.text || '';
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

  let result;
  let chatSession;
  let currentModelIndex = 0;

  // Try models with fallback
  while (currentModelIndex < MODEL_TIERS.length) {
    const tier = MODEL_TIERS[currentModelIndex];
    chatSession = ai.chats.create({
      model: tier.realId || tier.id,
      config: { systemInstruction, tools, temperature: 0.1 },
      history
    });

    try {
      // Use Promise.race to add a 45-second timeout to the Gemini call
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Gemini API Timeout')), 45000)
      );
      result = await Promise.race([
        chatSession.sendMessage({ message }),
        timeoutPromise
      ]);
      break; // Success, exit fallback loop
    } catch (error) {
      console.error(`Agent chat error with model ${tier.id}:`, error.message);
      currentModelIndex++;
    }
  }

  if (!result) {
    return res.status(500).json({ success: false, message: 'حدث خطأ في الاتصال بالذكاء الاصطناعي أو انتهى وقت الاتصال.' });
  }

  let functionCalls = result.functionCalls;
  let finalResponseText = result.text;
  let proposedAction = null;

  // Tool loop (max 4 iterations)
  let iteration = 0;
  while (functionCalls && functionCalls.length > 0 && iteration < 4) {
    const toolCall = functionCalls[0];
    const name = toolCall.name;
    const args = toolCall.args;
    let toolResult;

    try {
      const Model = MODELS_MAP[args.collectionName];
      if (!Model) throw new Error(`Collection ${args.collectionName} not supported`);

      if (name === 'searchDatabase') {
        const filter = safeParse(args.filterJson);
        const castFilter = castObjectIds(filter);
        const limit = args.limit || 20;
        
        // Dynamic selection based on collection
        let selectStr = '';
        if (args.collectionName === 'Product') selectStr = '_id name price stock isActive canBeAddedToBox isCustomBox boxDiscount category';
        else if (args.collectionName === 'User') selectStr = '_id firstName lastName email role isActive';
        else if (args.collectionName === 'Order') selectStr = '_id orderNumber status total user';
        else if (args.collectionName === 'Category') selectStr = '_id name slug isActive showInBox';

        const data = await Model.find(castFilter).select(selectStr).limit(limit).lean();
        toolResult = { data };
        iteration++;

      } else if (name === 'proposeDatabaseUpdate') {
        const updates = safeParse(args.updateJson);
        
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
      } else {
        toolResult = { error: 'Unknown tool' };
      }
    } catch (err) {
      toolResult = { error: err.message };
    }

    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Gemini API Timeout')), 15000)
      );
      result = await Promise.race([
        chatSession.sendMessage({ message: [{ functionResponse: { name, response: toolResult } }] }),
        timeoutPromise
      ]);
      functionCalls = result.functionCalls;
      finalResponseText = result.text;
      iteration++;
    } catch (err) {
      console.error('Error sending tool result:', err.message);
      if (!finalResponseText && !proposedAction) {
        finalResponseText = "عذراً، حدث خطأ في معالجة طلبك أو انتهى وقت الاتصال. يرجى المحاولة مرة أخرى.";
      }
      break;
    }
  }

  // Save model response
  const modelMsg = {
    role: 'model',
    text: finalResponseText || '',
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
