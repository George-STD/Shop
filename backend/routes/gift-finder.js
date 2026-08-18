const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const { generateWithFallback } = require('../utils/geminiModelManager');
const { sanitizeInput, publicAiLimiter } = require('../middleware/auth');

const { processReadyBoxes } = require('../controllers/productController');

let _aiClient = null;
function getAiClient() {
  if (!_aiClient) {
    const { GoogleGenAI } = require('@google/genai');
    _aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _aiClient;
}

// ============================================================================
// @route   POST /api/gift-finder/ai-recommend
// @desc    Analyze recipient personality & recommend top 5 ready gift boxes using Gemini AI
// @access  Public
// ============================================================================
router.post('/ai-recommend', publicAiLimiter, sanitizeInput, asyncHandler(async (req, res) => {
  const { recipient, occasion, personality, interests, mood, budgetRange, customNotes } = req.body;

  // 1. Fetch Active Ready Gift Boxes strictly
  let readyBoxes = await Product.find({ isActive: true, isReadyBox: true })
    .populate('category', 'name')
    .lean();

  // Fallback: If fewer than 5 explicit ready boxes exist, fetch active products with canBeAddedToBox
  if (!readyBoxes || readyBoxes.length < 5) {
    const existingIds = (readyBoxes || []).map(b => b._id);
    const additional = await Product.find({ isActive: true, canBeAddedToBox: true, _id: { $nin: existingIds } })
      .populate('category', 'name')
      .limit(30)
      .lean();
    readyBoxes = [...(readyBoxes || []), ...additional];
  }

  if (!readyBoxes || readyBoxes.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'لا تتوفر بوكسات هدايا جاهزة حالياً في المتجر.'
    });
  }

  // Calculate dynamic prices for ready boxes with autoCalculatePrice: true
  await processReadyBoxes(readyBoxes);

  // 2. Prepare lightweight box inventory summary for Gemini AI
  const boxInventory = readyBoxes.map((box, index) => {
    const includedNames = (box.includedProducts || [])
      .map(ip => ip.product?.name)
      .filter(Boolean);
    
    return {
      index: index + 1,
      id: box._id.toString(),
      name: box.name,
      price: box.price,
      salePrice: box.salePrice || box.price,
      description: box.shortDescription || (box.description ? box.description.substring(0, 150) : ''),
      tags: box.tags || [],
      occasions: box.occasions || [],
      recipients: box.recipients || [],
      includedItems: includedNames
    };
  });

  // 3. Construct Gemini AI Prompt for Personality & Ready Box Matching
  const prompt = `
أنت خبير تحليل الشخصيات ومستشار الهدايا الذكي لمتجر "ForYou" الهدايا.
تم إعطاؤك بيانات الشخص المراد تقديم الهدية له، بالإضافة لقائمة بوكسات الهدايا الجاهزة المتاحة في المتجر (عددها ${boxInventory.length}).

بيانات الهدية والشخصية المطلوب تحليلها:
- المستلم / صلة القرابة: "${recipient || 'غير محدد'}"
- المناسبة: "${occasion || 'مناسبة خاصة'}"
- طابع الشخصية: "${personality || 'شخصية راقية ومميزة'}"
- الاهتمامات والهوايات: "${interests || 'متنوعة'}"
- الشعور / الانطباع المطلوب من الهدية: "${mood || 'فخامة وتقدير'}"
- الميزانية المفضلّة: "${budgetRange || 'غير محدودة'}"
- ملاحظات وتفاصيل خاصة إضافية: "${customNotes || 'لا توجد'}"

قائمة البوكسات الجاهزة المتاحة بالمتجر:
${JSON.stringify(boxInventory, null, 2)}

التعليمات المطلوبة منك:
1. قم بتحليل شخصية وشغف هذا الشخص بناءً على الإجابات والملاحظات.
2. اكتب ملخصاً تحليلياً جذاباً ومشجعاً للشخصية (personalitySummary) في حدود 2-3 جمل باللغة العربية الفصحى الراقية.
3. حدد مسمى النمط الشخصي له (recipientArchetype) مثل: "عاشق الفخامة والهدوء", "الشخصية الرومانسية الدافئة", "عصري وأنيق", "محب للاسترخاء والعناية الذاتية", إلخ.
4. اختر أفضل 5 بوكسات هدايا جاهزة (بالتحديد 5 فقط) من القائمة المتاحة التي تتوافق مع هذه الشخصية والمناسبة والاهتمامات والميزانية.
5. لكل بوكس اختر نسبة توافق (matchScore من 88 إلى 99) واكتب سبباً محدداً ومقنعاً في 1-2 جملة (matchReason) يشرح لماذا هذا البوكس تحديداً يطابق شخصيته واهتماماته.

يجب أن تعيد النتيجة بصيغة JSON فقط بهذا الشكل الصارم وبدون أي نص أو markdown خارج الكائن:
{
  "personalitySummary": "...",
  "recipientArchetype": "...",
  "recommendations": [
    {
      "productId": "MongoDB_ID_Here",
      "matchScore": 98,
      "matchReason": "سبب الاختيار بالتفصيل..."
    }
  ]
}
`;

  let responseText = '';
  try {
    const aiClient = getAiClient();
    const result = await generateWithFallback(aiClient, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' }
    });
    responseText = result.text;
  } catch (aiErr) {
    console.error('Gemini AI Gift Finder Error:', aiErr.message);
    // Fallback if AI service is temporarily unavailable
    const top5 = readyBoxes.slice(0, 5);
    return res.json({
      success: true,
      data: {
        personalitySummary: 'بناءً على مدخلاتك، اخترنا لك تشكيلة متميزة من أرقى البوكسات الجاهزة المتناغمة مع ذوق مستلم الهدية.',
        recipientArchetype: 'شخصية مميزة وراقية',
        recommendedBoxes: top5.map((box, idx) => ({
          product: box,
          matchScore: 98 - (idx * 2),
          matchReason: `بوكس "${box.name}" خيار مميز يضم مكونات فائقة الجودة تناسب هذه المناسبة.`
        }))
      }
    });
  }

  // Parse JSON response from Gemini
  let parsed = null;
  try {
    const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    parsed = JSON.parse(cleanedText);
  } catch (pErr) {
    console.error('Failed to parse Gemini JSON:', responseText);
  }

  if (!parsed || !Array.isArray(parsed.recommendations) || parsed.recommendations.length === 0) {
    const top5 = readyBoxes.slice(0, 5);
    return res.json({
      success: true,
      data: {
        personalitySummary: 'بناءً على تحليل ذوق الهدية والمناسبة، تم ترشيح البوكسات الجاهزة الأكثر ملاءمة.',
        recipientArchetype: 'ذوق راقي ومميز',
        recommendedBoxes: top5.map((box, idx) => ({
          product: box,
          matchScore: 96 - (idx * 2),
          matchReason: `بوكس "${box.name}" يمنح تجربة إهداء ممتازة ومتناسقة.`
        }))
      }
    });
  }

  // Map AI recommendations back to complete Product DB documents
  const boxMap = new Map(readyBoxes.map(b => [b._id.toString(), b]));
  const recommendedBoxes = [];

  for (const rec of parsed.recommendations) {
    const productDoc = boxMap.get(String(rec.productId));
    if (productDoc) {
      recommendedBoxes.push({
        product: productDoc,
        matchScore: Math.min(99, Math.max(75, Number(rec.matchScore) || 95)),
        matchReason: rec.matchReason || `تم اختيار بوكس "${productDoc.name}" لتوافق مكوناته مع نمط واهتمامات الشخص.`
      });
    }
  }

  // If fewer than 5 matched due to ID mismatch, fill from remaining ready boxes
  if (recommendedBoxes.length < 5) {
    const existingIds = new Set(recommendedBoxes.map(r => r.product._id.toString()));
    for (const box of readyBoxes) {
      if (recommendedBoxes.length >= 5) break;
      if (!existingIds.has(box._id.toString())) {
        recommendedBoxes.push({
          product: box,
          matchScore: 91,
          matchReason: `بوكس "${box.name}" اختيار إضافي متناغم يعكس الذوق الفاخر.`
        });
      }
    }
  }

  return res.json({
    success: true,
    data: {
      personalitySummary: parsed.personalitySummary || 'تحليل مخصص لشخصية واهتمامات مستلم الهدية.',
      recipientArchetype: parsed.recipientArchetype || 'شخصية فريدة وراقية',
      recommendedBoxes: recommendedBoxes.slice(0, 5)
    }
  });
}));

module.exports = router;
