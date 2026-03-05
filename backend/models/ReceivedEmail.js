const mongoose = require('mongoose');

const receivedEmailSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  subject: { type: String, default: '(بدون عنوان)' },
  html: { type: String, default: '' },
  text: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

receivedEmailSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ReceivedEmail', receivedEmailSchema);
