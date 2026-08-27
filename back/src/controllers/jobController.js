import mongoose from 'mongoose';
import Job from '../models/Job.js';

export const getJobs = async (req, res) => {
  try {
    const list = await Job.find({}).sort({ order: 1 }).lean();
    res.json({ success: true, jobs: list });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createJob = async (req, res) => {
  try {
    const data = req.body;
    const val = data.title || data.name || 'وظيفة جديدة';
    const newJob = await Job.create({
      ...data,
      title: val,
      name: val,
      id: data.id || `job_${Date.now()}`,
    });
    res.status(201).json({ success: true, job: newJob });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const val = data.title || data.name;
    if (val) {
      data.title = val;
      data.name = val;
    }
    const updated = await Job.findOneAndUpdate(
      getIdFilter(id),
      { $set: data },
      { new: true }
    );
    res.json({ success: true, job: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    await Job.findOneAndDelete(getIdFilter(id));
    res.json({ success: true, message: 'تم حذف الوظيفة بنجاح' });
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
