import ServiceTree from '../models/ServiceTree.js';
import Makhdoom from '../models/Makhdoom.js';
import SystemMeta from '../models/SystemMeta.js';

export const getServices = async (req, res) => {
  try {
    const list = await ServiceTree.find({}).lean();
    res.json({ success: true, services: list, priestServices: list });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const saveServices = async (req, res) => {
  try {
    const payload = req.body;
    const servicesList = Array.isArray(payload) ? payload : [payload];

    for (const item of servicesList) {
      if (item.id || item._id) {
        await ServiceTree.findOneAndUpdate(
          { $or: [{ id: item.id }, { _id: item._id || item.id }] },
          { $set: item },
          { upsert: true, new: true }
        );
      } else {
        await ServiceTree.create(item);
      }
    }

    const updated = await ServiceTree.find({}).lean();
    res.json({ success: true, services: updated, priestServices: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { churchName, appTitle } = req.body;
    if (churchName) {
      await SystemMeta.findOneAndUpdate({ key: 'churchName' }, { value: churchName }, { upsert: true });
    }
    if (appTitle) {
      await SystemMeta.findOneAndUpdate({ key: 'appTitle' }, { value: appTitle }, { upsert: true });
    }
    res.json({ success: true, churchName, appTitle });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const transferRequest = async (req, res) => {
  try {
    const { makhdoomId, targetOsra, targetStage, targetFasl, requesterUsername } = req.body;
    await SystemMeta.create({
      key: `transfer_${Date.now()}`,
      value: { makhdoomId, targetOsra, targetStage, targetFasl, requesterUsername, status: 'pending', createdAt: new Date().toISOString() },
    });
    res.json({ success: true, message: 'تم إرسال طلب التحويل بنجاح' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const transferAccept = async (req, res) => {
  try {
    const { transferId, makhdoomId, targetOsra, targetStage, targetFasl } = req.body;
    await Makhdoom.findOneAndUpdate(
      { $or: [{ id: makhdoomId }, { _id: makhdoomId }] },
      { $set: { osra: targetOsra, stage: targetStage, fasl: targetFasl || '' } }
    );
    if (transferId) {
      await SystemMeta.findOneAndDelete({ $or: [{ _id: transferId }, { key: transferId }] });
    }
    res.json({ success: true, message: 'تم قبول التحويل ونقل المخدوم بنجاح' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const distributeWaznat = async (req, res) => {
  try {
    const { osra, stage, fasl, assignments } = req.body; // assignments: [{ makhdoomId, servantUsername }]
    if (Array.isArray(assignments)) {
      for (const a of assignments) {
        await Makhdoom.findOneAndUpdate(
          { $or: [{ id: a.makhdoomId }, { _id: a.makhdoomId }] },
          { $set: { assignedServant: a.servantUsername } }
        );
      }
    }
    res.json({ success: true, message: 'تم توزيع الوزنات بنجاح' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
