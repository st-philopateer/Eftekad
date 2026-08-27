import mongoose from 'mongoose';
import LessonPreparation from '../models/LessonPreparation.js';
import PreparationSubmission from '../models/PreparationSubmission.js';
import { saveBase64File } from '../utils/fileHelper.js';

export const getPreparations = async (req, res) => {
  try {
    const list = await LessonPreparation.find({}).lean();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createPreparation = async (req, res) => {
  try {
    const data = req.body;
    if (!data.lessonName) return res.status(400).json({ error: 'اسم الدرس مطلوب' });

    const newPrep = await LessonPreparation.create({
      ...data,
      id: data.id || `prep_${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
    res.status(201).json(newPrep);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePreparation = async (req, res) => {
  try {
    const { id } = req.params;
    await LessonPreparation.findOneAndDelete(getIdFilter(id));
    await PreparationSubmission.deleteMany({ preparationId: id });
    res.json({ success: true, message: 'تم حذف التحضير بنجاح' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSubmissions = async (req, res) => {
  try {
    const list = await PreparationSubmission.find({}).lean();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const submitPreparation = async (req, res) => {
  try {
    const { preparationId, servantUsername, fileName, fileData, serviceYear, lessonName } = req.body;
    if (!preparationId || !servantUsername || !fileData) {
      return res.status(400).json({ error: 'بيانات التسليم غير مكتملة' });
    }

    let finalLessonName = lessonName;
    if (!finalLessonName) {
      const prep = await LessonPreparation.findOne(getIdFilter(preparationId));
      if (prep) finalLessonName = prep.lessonName;
    }

    // Save base64 payload to physical file on disk to prevent heavy DB load
    const savedPath = saveBase64File(fileData, fileName || 'lesson.pdf');

    const updated = await PreparationSubmission.findOneAndUpdate(
      { preparationId, servantUsername: servantUsername.trim() },
      {
        $set: {
          fileName: fileName || 'file.pdf',
          fileData: savedPath,
          uploadedAt: new Date().toISOString(),
          serviceYear: serviceYear || '2026',
          ...(finalLessonName ? { lessonName: finalLessonName } : {}),
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, submission: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const evaluateSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { score, comment } = req.body;

    const parsedScore = score !== undefined && score !== null && score !== '' ? Number(score) : undefined;
    const cleanComment = (comment || '').trim();

    const existingSub = await PreparationSubmission.findOne(getIdFilter(id));
    let lessonName = existingSub?.lessonName;
    if (!lessonName && existingSub?.preparationId) {
      const prep = await LessonPreparation.findOne(getIdFilter(existingSub.preparationId));
      if (prep) lessonName = prep.lessonName;
    }

    const updated = await PreparationSubmission.findOneAndUpdate(
      getIdFilter(id),
      {
        $set: {
          score: parsedScore,
          comment: cleanComment,
          evaluatedAt: new Date().toISOString(),
          ...(lessonName ? { lessonName } : {}),
        },
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'لم يتم العثور على التسليم' });

    res.json({ success: true, submission: updated });
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
