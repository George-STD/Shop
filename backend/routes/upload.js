const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const { protect, admin, uploadLimiter } = require('../middleware/auth');

// Upload Limits & Memory Guard
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB per file
const MAX_INFLIGHT_BYTES = 80 * 1024 * 1024; // 80MB process-wide upload memory cap
let currentInflightBytes = 0;

/**
 * In-flight Memory Guard: Inspects Content-Length before allocating memory buffers
 */
const inflightGuard = (req, res, next) => {
  const declared = Number(req.headers['content-length'] || MAX_FILE_BYTES);

  if (declared > MAX_FILE_BYTES * 1.5) {
    return res.status(413).json({
      success: false,
      message: 'حجم الطلب أكبر من المسموح (الحد الأقصى للملف 5 ميجابايت).',
    });
  }

  if (currentInflightBytes + declared > MAX_INFLIGHT_BYTES) {
    res.set('Retry-After', '3');
    return res.status(503).json({
      success: false,
      message: 'الخادم مشغول برفع ملفات أخرى. حاول بعد لحظات.',
    });
  }

  currentInflightBytes += declared;
  let released = false;

  const release = () => {
    if (!released) {
      released = true;
      currentInflightBytes = Math.max(0, currentInflightBytes - declared);
    }
  };

  res.on('finish', release);
  res.on('close', release);

  next();
};

// Setup multer memory storage
const storage = multer.memoryStorage();

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('الصيغة غير مدعومة! الرجاء رفع صور JPG أو PNG أو WEBP فقط.');
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
  limits: { fileSize: MAX_FILE_BYTES },
});

// Magic bytes validator for JPEG, PNG, WEBP (GIF strictly excluded)
const validateImageMagicBytes = (buf) => {
  if (!buf || buf.length < 12) return false;

  // JPEG: FF D8 FF
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  // PNG: 89 50 4E 47
  const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  // WEBP: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
  const isWebp =
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50;

  return isJpeg || isPng || isWebp;
};

// @route   POST /api/upload
// @desc    Upload an image with Cloudinary streaming and 15s timeout
// @access  Private/Admin
router.post(
  '/',
  uploadLimiter,
  protect,
  admin,
  inflightGuard,
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'حجم الصورة كبير جداً. الحد الأقصى هو 5 ميجابايت.',
          });
        }
        return res.status(400).json({ success: false, message: err.message });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: typeof err === 'string' ? err : err.message || 'حدث خطأ غير متوقع',
        });
      }
      next();
    });
  },
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'لم يتم رفع أي ملف' });
    }

    if (!validateImageMagicBytes(req.file.buffer)) {
      req.file.buffer = null; // Free memory immediately
      return res.status(400).json({ success: false, message: 'محتوى الملف الفعلي ليس صورة صالحة (JPG, PNG, WEBP).' });
    }

    let isHandled = false;
    const timeout = setTimeout(() => {
      if (!isHandled) {
        isHandled = true;
        if (req.file) req.file.buffer = null;
        res.status(504).json({ success: false, message: 'استغرقت عملية رفع الصورة وقتاً أطول من المتوقع (15s).' });
      }
    }, 15_000);

    try {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'giftshop_uploads' },
        (error, result) => {
          clearTimeout(timeout);
          if (isHandled) return;
          isHandled = true;

          // Free buffer immediately for garbage collection
          if (req.file) req.file.buffer = null;

          if (error) {
            console.error('Cloudinary Upload Error:', error);
            return res.status(500).json({ success: false, message: 'حدث خطأ في خدمات Cloudinary أثناء الرفع.' });
          }

          res.json({
            success: true,
            url: result.secure_url,
          });
        }
      );

      uploadStream.end(req.file.buffer);
    } catch (err) {
      clearTimeout(timeout);
      if (req.file) req.file.buffer = null;
      if (!isHandled) {
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء معالجة رفع الملف' });
      }
    }
  }
);

module.exports = router;
