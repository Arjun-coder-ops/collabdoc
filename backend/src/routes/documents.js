const express = require('express');
const Document = require('../models/Document');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const docs = await Document.find({
      $or: [{ owner: req.user._id }, { collaborators: req.user._id }]
    })
    .populate('owner', 'name email color')
    .sort({ updatedAt: -1 })
    .select('-yjsState -content');
    res.json({ documents: docs });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const doc = await Document.create({
      title: req.body.title || 'Untitled Document',
      owner: req.user._id,
    });
    await doc.populate('owner', 'name email color');
    res.status(201).json({ document: doc });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
      .populate('owner', 'name email color')
      .populate('collaborators', 'name email color');

    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const canAccess =
      doc.owner._id.toString() === req.user._id.toString() ||
      doc.collaborators.some(c => c._id.toString() === req.user._id.toString()) ||
      doc.isPublic;

    if (!canAccess) return res.status(403).json({ message: 'Access denied' });

    res.json({ document: doc });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/title', auth, async (req, res) => {
  try {
    const doc = await Document.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { title: req.body.title },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'Not found or unauthorized' });
    res.json({ document: doc });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/visibility', auth, async (req, res) => {
  try {
    const doc = await Document.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { isPublic: req.body.isPublic },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'Not found or unauthorized' });
    res.json({ document: doc });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const doc = await Document.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!doc) return res.status(404).json({ message: 'Not found or unauthorized' });
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/share/:token', async (req, res) => {
  try {
    const doc = await Document.findOne({ shareToken: req.params.token, isPublic: true })
      .populate('owner', 'name email color');
    if (!doc) return res.status(404).json({ message: 'Document not found or not public' });
    res.json({ document: doc });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
