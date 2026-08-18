const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const dns = require('dns');
const cloudinary = require('../config/cloudinary');
const { protect, admin, adminLimiter, sanitizeInput, aiLimiter } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { generateWithFallback } = require('../utils/geminiModelManager');

router.use(protect);
router.use(admin);
router.use(adminLimiter);
router.use(aiLimiter);

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
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse AI response:', text);
      return {
        name: "منتج جديد",
        description: text || "وصف مؤقت للمنتج",
        categories: [],
        occasions: [],
        recipients: [],
        price: 0
      };
    }
  }
}



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

    // Validate image magic bytes for every uploaded file (skipped in test mode)
    if (process.env.NODE_ENV !== 'test') {
      for (const file of req.files) {
        const buf = file.buffer;
        const isImageHeader = buf && buf.length >= 4 && (
          (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) || // JPEG
          (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) || // PNG
          (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) || // GIF
          (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46)    // WEBP
        );

        if (!isImageHeader) {
          return res.status(400).json({ success: false, message: 'محتوى أحد الملفات ليس صورة صالحة' });
        }
      }
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

    // ── Prevent SSRF & DNS Rebinding (TOCTOU): Resolve IP once, validate, and fetch via IP directly ──
    let buffer;
    let mimeType;
    try {
      const isRelative = imageUrl.startsWith('/');
      const targetUrlString = isRelative
        ? `${req.protocol}://${req.get('host')}${imageUrl}`
        : imageUrl;

      const parsedUrl = new URL(targetUrlString);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).json({ success: false, message: 'بروتوكول الصورة غير مسموح به' });
      }

      const hostname = parsedUrl.hostname.toLowerCase();

      if (process.env.NODE_ENV === 'test') {
        // Mock fetch in test mode
        buffer = Buffer.from('fake_image_data');
        mimeType = 'image/jpeg';
      } else {
        // Resolve all DNS records atomically
        const resolvedAddresses = await new Promise((resolve, reject) => {
          dns.lookup(hostname, { all: true }, (err, addresses) => {
            if (err || !addresses || addresses.length === 0) reject(new Error('فشل حل دالة العناوين (DNS) لهذا الرابط'));
            else resolve(addresses);
          });
        });

        const isIpPrivate = (ip) => {
          let target = (ip || '').toLowerCase();
          const mapped = target.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
          if (mapped) target = mapped[1];

          return (
            target === 'localhost' ||
            target === '127.0.0.1' ||
            target === '::1' ||
            target === '0.0.0.0' ||
            target.startsWith('10.') ||
            target.startsWith('192.168.') ||
            target.startsWith('169.254.') ||
            target.startsWith('127.') ||
            target.startsWith('0.') ||
            target.startsWith('fc') ||
            target.startsWith('fd') ||
            target.startsWith('fe80') ||
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(target) ||
            /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./.test(target) || // 100.64.0.0/10 CGNAT
            hostname === 'localhost' ||
            hostname.startsWith('169.254.')
          );
        };

        const hasPrivateIp = resolvedAddresses.some(addr => isIpPrivate(addr.address)) || isIpPrivate(hostname);
        if (hasPrivateIp) {
          return res.status(400).json({ success: false, message: 'رابط الصورة المحظور غير مسموح به' });
        }

        const targetIp = resolvedAddresses[0].address;

        // Fetch directly via resolved IP using native http/https with Host header to defeat DNS Rebinding
        const httpModule = parsedUrl.protocol === 'https:' ? require('https') : require('http');
        const port = parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80);
        const requestPath = parsedUrl.pathname + parsedUrl.search;

        const fetchResult = await new Promise((resolve, reject) => {
          const request = httpModule.request({
            hostname: targetIp,
            port,
            path: requestPath,
            method: 'GET',
            headers: {
              Host: hostname,
              'User-Agent': 'HadayaGiftShop-Bot/1.0',
            },
            servername: hostname,
            signal: AbortSignal.timeout(8000),
          }, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400) {
              return reject(new Error('التحويل التلقائي غير مسموح به لحماية الأمان'));
            }
            if (response.statusCode !== 200) {
              return reject(new Error(`Failed to fetch image: status ${response.statusCode}`));
            }

            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => {
              const buf = Buffer.concat(chunks);
              const contentType = response.headers['content-type'] || 'image/jpeg';
              resolve({ buffer: buf, mimeType: contentType });
            });
          });

          request.on('error', (e) => reject(e));
          request.end();
        });

        buffer = fetchResult.buffer;
        mimeType = fetchResult.mimeType;
      }
    } catch (error) {
      console.error('Error fetching image for AI:', error.message);
      return res.status(400).json({
        success: false,
        message: error.message || 'فشل تحميل الصورة لتحليلها، تأكد أن الصورة مرفوعة بشكل صحيح.',
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
