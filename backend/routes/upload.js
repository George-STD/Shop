const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const { protect, admin } = require('../middleware/auth');

// Setup multer memory storage
const storage = multer.memoryStorage();

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('الصيغة غير مدعومة! الرجاء رفع صور فقط.');
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});

// @route   POST /api/upload
// @desc    Upload an image
// @access  Private/Admin
router.post('/', protect, admin, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'حجم الصورة كبير جداً. الحد الأقصى هو 20 ميجابايت.' });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: typeof err === 'string' ? err : err.message || 'حدث خطأ غير متوقع' });
    }
    next();
  });
}, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'لم يتم رفع أي ملف' });
  }

  // Validate image magic bytes to prevent file extension spoofing
  const buf = req.file.buffer;
  const isImageHeader = buf && buf.length >= 12 && (
    (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) || // JPEG
    (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) || // PNG
    (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) || // GIF
    (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
     buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50)    // WEBP (RIFF....WEBP)
  );

  if (!isImageHeader) {
    return res.status(400).json({ success: false, message: 'محتوى الملف الفعلي ليس صورة صالحة.' });
  }

  // Upload the file buffer to Cloudinary
  const uploadStream = cloudinary.uploader.upload_stream(
    { folder: 'giftshop_uploads' },
    (error, result) => {
      if (error) {
        console.error('Cloudinary Upload Error:', error);
        return res.status(500).json({ success: false, message: 'حدث خطأ في خدمات Cloudinary أثناء الرفع.' });
      }
      
      // Return the Cloudinary secure URL
      res.json({
        success: true,
        url: result.secure_url
      });
    }
  );

  uploadStream.end(req.file.buffer);
});

module.exports = router;
