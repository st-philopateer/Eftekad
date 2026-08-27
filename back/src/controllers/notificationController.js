import mongoose from 'mongoose';
import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  try {
    const { targetUser } = req.query;
    const filter = {};
    if (targetUser) {
      filter.$or = [{ targetUser }, { targetUser: 'all' }];
    }
    const list = await Notification.find(filter).sort({ timestamp: -1 }).limit(100).lean();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findOneAndUpdate(
      getIdFilter(id),
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const { targetUser } = req.body;
    const filter = targetUser ? { $or: [{ targetUser }, { targetUser: 'all' }] } : {};
    await Notification.updateMany(filter, { $set: { read: true } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSyncMessages = async (req, res) => {
  try {
    const { targetUser } = req.query;
    const filter = targetUser ? { $or: [{ targetUser }, { targetUser: 'all' }] } : {};
    const list = await Notification.find(filter).lean();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getIdFilter = (id) => {
  if (!id) return { id: 'invalid_id_placeholder' };
  const is24Hex = mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
  if (is24Hex) {
    return { _id: id };
  }
  return { id };
};
