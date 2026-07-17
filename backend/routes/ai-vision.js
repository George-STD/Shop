const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const { protect, admin, adminLimiter, sanitizeInput } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

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

// Apply the same middleware chain as the main admin routes
router.use(protect);
router.use(admin);
router.use(adminLimiter);

// @route   POST /api/admin/ai/vision-analyze
// @desc    Analyze up to 5 images as a single product and return structured JSON
// @access  Private/Admin
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
      const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: [prompt, ...imageParts],
        config: {
          responseMimeType: 'application/json',
        },
      });

      let generatedText = response.text;

      // Parse the JSON
      let productData;
      try {
        productData = JSON.parse(generatedText);
      } catch (_parseErr) {
        // In case the model wrapped it in markdown code fences
        generatedText = generatedText.replace(/```json\n?/g, '').replace(/```/g, '').trim();
        productData = JSON.parse(generatedText);
      }

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
      });
    } catch (error) {
      console.error('AI Vision or Cloudinary Error:', error.message || error);
      
      let message = 'حدث خطأ أثناء تحليل أو حفظ الصور. تأكد من إعدادات API.';
      if (error.status === 429 || (error.message && error.message.includes('429'))) {
        message = 'لقد تجاوزت الحد المسموح به للاستخدام المجاني للذكاء الاصطناعي (Rate Limit). يرجى الانتظار دقيقة والمحاولة مرة أخرى.';
      }

      res.status(500).json({
        success: false,
        message,
      });
    }
  }, 'حدث خطأ أثناء تحليل أو رفع الصور')
);

module.exports = router;
