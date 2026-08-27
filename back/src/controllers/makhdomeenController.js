import mongoose from 'mongoose';
import Makhdoom from '../models/Makhdoom.js';

export const getMakhdomeen = async (req, res) => {
  try {
    const { year, osra, stage, fasl } = req.query;
    const filter = {};
    if (year) filter.serviceYear = year;
    if (osra) filter.osra = osra;
    if (stage) filter.stage = stage;
    if (fasl) filter.fasl = fasl;

    const list = await Makhdoom.find(filter).lean();
    res.json({ success: true, makhdomeen: list });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createMakhdoom = async (req, res) => {
  try {
    const data = req.body;
    if (!data.name) return res.status(400).json({ error: 'اسم المخدوم مطلوب' });

    const newMakhdoom = await Makhdoom.create({
      ...data,
      id: data.id || `${Date.now()}${Math.random()}`,
      status: data.status || 'active',
      timestamp: data.timestamp || new Date().toISOString(),
    });

    res.status(201).json({ success: true, makhdoom: newMakhdoom, ...newMakhdoom.toObject() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMakhdoom = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updated = await Makhdoom.findOneAndUpdate(
      getIdFilter(id),
      { $set: updateData },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'المخدوم غير موجود' });
    res.json({ success: true, message: 'تم تحديث البيانات بنجاح', makhdoom: updated, ...updated.toObject() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteMakhdoom = async (req, res) => {
  try {
    const { id } = req.params;
    await Makhdoom.findOneAndDelete(getIdFilter(id));
    res.json({ success: true, message: 'تم حذف المخدوم بنجاح' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const batchUpdateMakhdomeen = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { id, changes }
    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Invalid updates payload' });
    }

    const bulkOps = updates.map(u => ({
      updateOne: {
        filter: { $or: [{ id: u.id }, { _id: u.id }] },
        update: { $set: u.changes },
      }
    }));

    if (bulkOps.length > 0) {
      await Makhdoom.bulkWrite(bulkOps);
    }

    res.json({ success: true, count: updates.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const renameClass = async (req, res) => {
  try {
    const { osra, stage, oldClassName, newClassName } = req.body;
    if (!osra || !stage || !oldClassName || !newClassName) {
      return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    }

    const result = await Makhdoom.updateMany(
      { osra, stage, fasl: oldClassName },
      { $set: { fasl: newClassName } }
    );

    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const promoteMakhdoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { nextStage, nextFasl } = req.body;

    const updated = await Makhdoom.findOneAndUpdate(
      getIdFilter(id),
      { $set: { stage: nextStage, fasl: nextFasl || '' } },
      { new: true }
    );

    res.json({ success: true, makhdoom: updated });
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
