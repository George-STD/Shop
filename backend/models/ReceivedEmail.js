const mongoose = require('mongoose');

const receivedEmailSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  subject: { type: String, default: '(بدون عنوان)', maxlength: 500 },
  html: { type: String, default: '' },
  text: { type: String, default: '', maxlength: 50000 },
  isRead: { type: Boolean, default: false },
  authStatus: {
    type: String,
    enum: ['verified', 'unverified'],
    default: 'unverified'
  },
}, { timestamps: true });

receivedEmailSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ReceivedEmail', receivedEmailSchema);
