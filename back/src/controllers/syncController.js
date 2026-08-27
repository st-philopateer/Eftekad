import Makhdoom from '../models/Makhdoom.js';
import User from '../models/User.js';
import ServiceTree from '../models/ServiceTree.js';
import Attendance from '../models/Attendance.js';
import Visitation from '../models/Visitation.js';
import EvaluationTemplate from '../models/EvaluationTemplate.js';
import ServantEvaluation from '../models/ServantEvaluation.js';
import LessonPreparation from '../models/LessonPreparation.js';
import PreparationSubmission from '../models/PreparationSubmission.js';
import Notification from '../models/Notification.js';
import SystemMeta from '../models/SystemMeta.js';
import Job from '../models/Job.js';
import mongoose from 'mongoose';

export const getFullSync = async (req, res) => {
  try {
    const [
      makhdomeen,
      users,
      priestServices,
      attendance,
      servantVisitations,
      evaluationTemplates,
      servantEvaluations,
      preparations,
      preparationSubmissions,
      notifications,
      jobs,
    ] = await Promise.all([
      Makhdoom.find({}).lean(),
      User.find({}).lean(),
      ServiceTree.find({}).lean(),
      Attendance.find({}).lean(),
      Visitation.find({}).lean(),
      EvaluationTemplate.find({}).lean(),
      ServantEvaluation.find({}).lean(),
      LessonPreparation.find({}).lean(),
      PreparationSubmission.find({}).lean(),
      Notification.find({}).lean(),
      Job.find({}).lean(),
    ]);

    res.json({
      makhdomeen,
      users,
      priestServices,
      attendance,
      servantVisitations,
      evaluationTemplates,
      servantEvaluations,
      preparations,
      preparationSubmissions,
      notifications,
      jobs,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSyncVersions = async (req, res) => {
  try {
    res.json({
      makhdomeen: Date.now(),
      services: Date.now(),
      attendance: Date.now(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSyncByKey = async (req, res) => {
  try {
    const { key } = req.params;
    let data = [];
    if (key === 'makhdomeen') data = await Makhdoom.find({}).lean();
    else if (key === 'users') data = await User.find({}).lean();
    else if (key === 'priestServices') data = await ServiceTree.find({}).lean();
    else if (key === 'attendance') data = await Attendance.find({}).lean();
    else if (key === 'servantVisitations') data = await Visitation.find({}).lean();
    else if (key === 'evaluationTemplates') data = await EvaluationTemplate.find({}).lean();
    else if (key === 'servantEvaluations') data = await ServantEvaluation.find({}).lean();
    else if (key === 'preparations') data = await LessonPreparation.find({}).lean();
    else if (key === 'preparationSubmissions') data = await PreparationSubmission.find({}).lean();
    else if (key === 'notifications') data = await Notification.find({}).lean();
    else if (key === 'jobs') data = await Job.find({}).lean();

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const postSync = async (req, res) => {
  try {
    const data = req.body;
    res.json({ success: true, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const postSyncDelta = async (req, res) => {
  try {
    res.json({ success: true, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getArchivedReports = async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const adminDiagnose = async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;
    res.json({
      status: 'ok',
      mongoConnected: isConnected,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
