const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: { type: String, default: 'Untitled Document', trim: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  content: { type: String, default: '' },
  yjsState: { type: Buffer, default: null },
  isPublic: { type: Boolean, default: false },
  shareToken: { type: String, default: () => Math.random().toString(36).substring(2, 15) },
}, { timestamps: true });

documentSchema.index({ owner: 1, updatedAt: -1 });

module.exports = mongoose.model('Document', documentSchema);
