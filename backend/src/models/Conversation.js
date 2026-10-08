import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  type: {
    type: String,
    enum: ['DIRECT', 'GROUP'],
    default: 'DIRECT'
  },
  name: {
    type: String,
    trim: true
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Create a compound index for fast lookups of user conversations
conversationSchema.index({ participants: 1, lastMessageAt: -1 });

export default mongoose.model('Conversation', conversationSchema);
