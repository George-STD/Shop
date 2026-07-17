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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// @route   POST /api/upload
// @desc    Upload an image
// @access  Private/Admin
router.post('/', protect, admin, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'لم يتم رفع أي ملف' });
  }

  // Upload the file buffer to Cloudinary
  const uploadStream = cloudinary.uploader.upload_stream(
    { folder: 'giftshop_uploads' },
    (error, result) => {
      if (error) {
        console.error('Cloudinary Upload Error:', error);
        return res.status(500).json({ success: false, message: 'حدث خطأ أثناء رفع الصورة.' });
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
