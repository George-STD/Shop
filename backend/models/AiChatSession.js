const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'model'],
      required: true,
    },
    text: {
      type: String,
      default: '',
    },
    searchContext: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    proposedAction: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    executed: {
      type: mongoose.Schema.Types.Mixed, // true, false, 'rejected'
      default: false,
    },
  },
  { _id: true, timestamps: true }
);

const aiChatSessionSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'محادثة جديدة',
    },
    messages: [messageSchema],
  },
  {
    timestamps: true,
  }
);

// Auto-expire chat session dumps after 90 days to prevent unbounded storage growth
aiChatSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('AiChatSession', aiChatSessionSchema);
