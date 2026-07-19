const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const { protect, admin, adminLimiter, sanitizeInput } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { generateWithFallback } = require('../utils/geminiModelManager');

// Lazily initialized — only created when the first request arrives
let _aiClient = null;
function getAiClient() {
  if (!_aiClient) {
    const { GoogleGenAI } = require('@google/genai');
    _aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _aiClient;
}

// Setup multer memory storage (no disk I/O needed)
const storage = multer.memoryStorage();

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('الصيغة غير مدعومة! الرجاء رفع صور فقط.'));
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});

/**
 * Converts a memory buffer to the inlineData format required by the GenAI SDK.
 */
function fileToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType,
    },
  };
}

/**
 * Helper: handle rate-limit errors from the model manager and send
 * the appropriate JSON response. Returns true if it handled the error.
 */
function handleRateLimitError(res, error) {
  if (error.retryAfterSeconds) {
    res.status(429).json({
      success: false,
      retryAfter: error.retryAfterSeconds,
      message: error.message,
    });
    return true;
  }
  if (error.allDailyExhausted) {
    res.status(429).json({
      success: false,
      allDailyExhausted: true,
      message: error.message,
    });
    return true;
  }
  return false;
}

/**
 * Helper: safely parse JSON that may be wrapped in markdown fences.
 */
function safeParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch (_) {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  }
}

// Apply the same middleware chain as the main admin routes
router.use(protect);
router.use(admin);
router.use(adminLimiter);

// ──────────────────────────────────────────────────────────────────
// @route   POST /api/admin/ai/vision-analyze
// @desc    Analyze up to 5 images as a single product and return structured JSON
// @access  Private/Admin
// ──────────────────────────────────────────────────────────────────
router.post(
  '/vision-analyze',
  upload.array('images', 5),
  asyncHandler(async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'مفتاح GEMINI_API_KEY غير موجود في إعدادات السيرفر. أضفه في ملف .env',
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'لم يتم رفع أي صور للتحليل' });
    }

    // Prepare images for Gemini directly from memory buffers
    const imageParts = req.files.map((file) => fileToGenerativePart(file.buffer, file.mimetype));

    // NOTE: The "recipients" list MUST match the enum in models/Product.js exactly.
    const prompt = `
أنت خبير إدخال بيانات لمتجر هدايا مصري (Gift Shop).
استناداً إلى هذه الصورة/الصور، قم بتحليل المنتج واستخراج البيانات التالية في شكل JSON صالح فقط (بدون أي نصوص إضافية أو Markdown):

{
  "name": "اسم جذاب ومناسب للمنتج باللغة العربية",
  "description": "وصف تسويقي مقنع وجذاب للمنتج باللغة العربية (سطرين أو ثلاثة)",
  "categories": ["اختر فئة أو اثنين من: ساعات، محافظ، هدايا رجالي، هدايا حريمي، مجات، بوكسات هدايا، ورد، إكسسوارات"],
  "occasions": ["اختر الأنسب من: عيد ميلاد، تخرج، ذكرى زواج، عيد الحب، عيد الأم، بدون مناسبة"],
  "recipients": ["اختر الأنسب فقط من هذه القائمة بالضبط: زوجة، زوج، أم، أب، أخت، أخ، صديقة، صديق، أطفال، عروسين"],
  "price": 0
}

ملاحظات هامة:
- اختر الأنسب دائماً للـ categories و occasions و recipients (لا تختر الكل، اختر المناسب فقط).
- في recipients: استخدم فقط القيم المذكورة بالضبط (زوجة، زوج، أم، أب، أخت، أخ، صديقة، صديق، أطفال، عروسين). لا تستخدم أي قيم أخرى.
- اجعل السعر دائماً 0 لأن المالك سيقوم بتحديده لاحقاً.
- أخرج فقط الـ JSON Object النهائي لتسهيل معالجته برمجياً.
    `;

    try {
      const ai = getAiClient();
      const result = await generateWithFallback(ai, {
        contents: [prompt, ...imageParts],
        config: { responseMimeType: 'application/json' },
      });

      const productData = safeParseJSON(result.text);

      // Upload all image buffers to Cloudinary concurrently
      const uploadPromises = req.files.map((file) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'giftshop_ai_bulk' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result.secure_url);
            }
          );
          uploadStream.end(file.buffer);
        });
      });

      // Wait for all Cloudinary uploads to complete and collect their secure URLs
      const imageUrls = await Promise.all(uploadPromises);

      // Return the generated data plus the permanent Cloudinary URLs
      res.json({
        success: true,
        data: {
          ...productData,
          images: imageUrls.map((url) => ({ url, alt: productData.name || '' })),
        },
        modelUsed: result.modelUsed,
      });
    } catch (error) {
      if (handleRateLimitError(res, error)) return;

      console.error('AI Vision or Cloudinary Error:', error.message || error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء تحليل أو حفظ الصور. تأكد من إعدادات API.',
      });
    }
  }, 'حدث خطأ أثناء تحليل أو رفع الصور')
);

// ──────────────────────────────────────────────────────────────────
// @route   POST /api/admin/ai/enhance-product
// @desc    Analyze a product image URL and suggest better title & description
// @access  Private/Admin
// ──────────────────────────────────────────────────────────────────
router.post(
  '/enhance-product',
  asyncHandler(async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'مفتاح GEMINI_API_KEY غير موجود في إعدادات السيرفر.',
      });
    }

    const { imageUrl, currentName, currentDescription } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'رابط الصورة مطلوب' });
    }

    // ── Fetch image from URL and convert to base64 ──
    let buffer;
    let mimeType;
    try {
      const fetchUrl = imageUrl.startsWith('/')
        ? `${req.protocol}://${req.get('host')}${imageUrl}`
        : imageUrl;
      const fetchResponse = await fetch(fetchUrl);
      if (!fetchResponse.ok) {
        throw new Error(`Failed to fetch image: ${fetchResponse.statusText}`);
      }
      const arrayBuffer = await fetchResponse.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      mimeType = fetchResponse.headers.get('content-type') || 'image/jpeg';
    } catch (error) {
      console.error('Error fetching image for AI:', error.message);
      return res.status(400).json({
        success: false,
        message: 'فشل تحميل الصورة لتحليلها، تأكد أن الصورة مرفوعة بشكل صحيح.',
      });
    }

    const imagePart = fileToGenerativePart(buffer, mimeType);

    // ── Build context-aware prompt ──
    const hasContext = currentName || currentDescription;
    const prompt = `
أنت خبير في كتابة المحتوى التسويقي لمتجر هدايا مصري (Gift Shop).
${
  hasContext
    ? `
البيانات الحالية للمنتج:
- الاسم الحالي: ${currentName || 'غير محدد'}
- الوصف الحالي: ${currentDescription || 'غير محدد'}

استناداً إلى الصورة والبيانات الحالية، اقترح عنوان ووصف أفضل بكثير وأكثر جاذبية وإبداعاً للمبيعات.
لا تكرر نفس المحتوى الحالي، بل حسّنه واجعله أكثر احترافية.
`
    : `
استناداً إلى هذه الصورة، اقترح عنوان ووصف تسويقي جذاب ومبدع للمنتج.
`
}
أخرج النتيجة في شكل JSON صالح فقط (بدون أي نصوص إضافية أو Markdown):

{
  "name": "عنوان جذاب ومناسب جداً للمنتج باللغة العربية",
  "description": "وصف تسويقي مقنع وجذاب للمنتج يبرز مميزاته ويشجع على الشراء (حوالي 2-3 أسطر) باللغة العربية"
}
    `;

    try {
      const ai = getAiClient();
      const result = await generateWithFallback(ai, {
        contents: [prompt, imagePart],
        config: { responseMimeType: 'application/json' },
      });

      const productData = safeParseJSON(result.text);

      res.json({
        success: true,
        data: productData,
        modelUsed: result.modelUsed,
      });
    } catch (error) {
      if (handleRateLimitError(res, error)) return;

      console.error('Gemini AI Error:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء تحليل الصورة بواسطة الذكاء الاصطناعي.',
      });
    }
  }, 'حدث خطأ أثناء تحسين بيانات المنتج')
);

module.exports = router;
