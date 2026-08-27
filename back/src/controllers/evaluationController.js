import mongoose from 'mongoose';
import EvaluationTemplate from '../models/EvaluationTemplate.js';
import ServantEvaluation from '../models/ServantEvaluation.js';
import SystemMeta from '../models/SystemMeta.js';

export const getEvaluations = async (req, res) => {
  try {
    const list = await ServantEvaluation.find({}).lean();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const saveEvaluation = async (req, res) => {
  try {
    const { templateId, servantUsername, weekDate, value, serviceYear } = req.body;
    const updated = await ServantEvaluation.findOneAndUpdate(
      { templateId, servantUsername, weekDate },
      { $set: { value, scannedAt: new Date().toISOString(), serviceYear: serviceYear || '2026' } },
      { upsert: true, new: true }
    );
    res.json({ success: true, evaluation: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getEvaluationTemplates = async (req, res) => {
  try {
    const list = await EvaluationTemplate.find({}).lean();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createEvaluationTemplate = async (req, res) => {
  try {
    const data = req.body;
    if (!data.name) return res.status(400).json({ error: 'اسم البند مطلوب' });

    const newTemplate = await EvaluationTemplate.create({
      ...data,
      id: data.id || `eval_${Date.now()}`,
      active: true,
    });
    res.status(201).json(newTemplate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateEvaluationTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await EvaluationTemplate.findOneAndUpdate(
      getIdFilter(id),
      { $set: req.body },
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteEvaluationTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    await EvaluationTemplate.findOneAndDelete(getIdFilter(id));
    res.json({ success: true, message: 'تم حذف البند بنجاح' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getServantEvaluations = async (req, res) => {
  try {
    const { servantUsername, weekDate, serviceYear } = req.query;
    const filter = {};
    if (servantUsername) filter.servantUsername = servantUsername;
    if (weekDate) filter.weekDate = weekDate;
    if (serviceYear) filter.serviceYear = serviceYear;

    const list = await ServantEvaluation.find(filter).lean();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const saveServantEvaluation = async (req, res) => {
  try {
    const { templateId, servantUsername, weekDate, value, serviceYear } = req.body;
    const updated = await ServantEvaluation.findOneAndUpdate(
      { templateId, servantUsername, weekDate },
      { $set: { value, scannedAt: new Date().toISOString(), serviceYear: serviceYear || '2026' } },
      { upsert: true, new: true }
    );
    res.json({ success: true, evaluation: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const scanServantEvaluation = async (req, res) => {
  try {
    const { qrData, templateId, weekDate, serviceYear } = req.body;
    const servantUsername = (qrData || '').trim();
    if (!servantUsername || !templateId) {
      return res.status(400).json({ error: 'بيانات المسح غير مكتملة' });
    }

    const updated = await ServantEvaluation.findOneAndUpdate(
      { templateId, servantUsername, weekDate: weekDate || new Date().toISOString().split('T')[0] },
      { $set: { value: true, scannedAt: new Date().toISOString(), serviceYear: serviceYear || '2026' } },
      { upsert: true, new: true }
    );

    res.json({ success: true, servantUsername, evaluation: updated });
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
