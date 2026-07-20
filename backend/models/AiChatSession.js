const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'model'],
    required: true
  },
  text: {
    type: String,
    default: ''
  },
  proposedAction: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  executed: {
    type: mongoose.Schema.Types.Mixed, // true, false, 'rejected'
    default: false
  }
}, { _id: true, timestamps: true });

const aiChatSessionSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'محادثة جديدة'
  },
  messages: [messageSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('AiChatSession', aiChatSessionSchema);
