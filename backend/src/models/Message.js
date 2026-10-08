import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['TEXT', 'FILE', 'TASK', 'MEETING'],
    default: 'TEXT'
  },
  // For file attachments
  fileUrl: String,
  fileName: String,
  fileType: String,
  fileSize: Number,
  
  // For HR/Admin actions
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  meetingDetails: {
    title: String,
    url: String,
    date: Date,
    startTime: String,
    endTime: String
  },
  
  // Interactions
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String
  }],
  
  isDeleted: {
    type: Boolean,
    default: false
  },
  isEdited: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

messageSchema.index({ conversationId: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
