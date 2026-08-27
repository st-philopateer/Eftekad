import mongoose from 'mongoose';
import StageList from '../models/StageList.js';
import Makhdoom from '../models/Makhdoom.js';
import ServiceTree from '../models/ServiceTree.js';

export const getStagesList = async (req, res) => {
  try {
    const list = await StageList.find({}).sort({ order: 1 }).lean();
    res.json({ success: true, stagesList: list });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createStage = async (req, res) => {
  try {
    const data = req.body;
    await StageList.create({
      ...data,
      id: data.id || `stage_${Date.now()}`,
    });
    const list = await StageList.find({}).sort({ order: 1 }).lean();
    res.status(201).json({ success: true, stagesList: list });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateStage = async (req, res) => {
  try {
    const { id } = req.params;
    await StageList.findOneAndUpdate(
      getIdFilter(id),
      { $set: req.body },
      { new: true }
    );
    const list = await StageList.find({}).sort({ order: 1 }).lean();
    res.json({ success: true, stagesList: list });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteStage = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedStage = await StageList.findOne(getIdFilter(id));
    if (deletedStage) {
      const stageName = deletedStage.name;
      // 1. Delete from StageList
      await StageList.deleteOne({ _id: deletedStage._id });

      // 2. Cascade delete/update Makhdoom records
      await Makhdoom.updateMany({ stage: stageName }, { $set: { stage: '', fasl: '' } });

      // 3. Cascade delete stage configuration from ServiceTree (priestServices)
      const trees = await ServiceTree.find({});
      for (const tree of trees) {
        let changed = false;
        if (tree.osras && Array.isArray(tree.osras)) {
          tree.osras = tree.osras.map(osra => {
            if (osra.stages && Array.isArray(osra.stages)) {
              const origLen = osra.stages.length;
              osra.stages = osra.stages.filter(stg => stg.name !== stageName);
              if (osra.stages.length !== origLen) {
                changed = true;
              }
            }
            return osra;
          });
        }
        if (changed) {
          tree.markModified('osras');
          await tree.save();
        }
      }
    }
    const list = await StageList.find({}).sort({ order: 1 }).lean();
    res.json({ success: true, message: 'تم حذف المرحلة بنجاح', stagesList: list });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const promoteStage = async (req, res) => {
  try {
    const { stageIds } = req.body;
    if (!stageIds || !Array.isArray(stageIds) || stageIds.length === 0) {
      return res.status(400).json({ error: 'الرجاء تحديد المراحل المطلوب ترقيتها' });
    }

    const allStages = await StageList.find({}).sort({ order: 1 }).lean();
    let totalPromoted = 0;

    for (const id of stageIds) {
      const currentStageIndex = allStages.findIndex(s => s.id === id || s._id.toString() === id);
      if (currentStageIndex === -1) continue;

      const currentStage = allStages[currentStageIndex];
      const nextStage = allStages[currentStageIndex + 1];

      if (currentStage.promotionType === 'manual') {
        const result = await Makhdoom.updateMany(
          { stage: currentStage.name },
          { 
            $set: { 
              pendingPromotionFrom: currentStage.name,
              stage: '',
              fasl: '',
              osra: '' 
            } 
          }
        );
        totalPromoted += result.modifiedCount;
      } else {
        if (nextStage) {
          const result = await Makhdoom.updateMany(
            { stage: currentStage.name },
            { 
              $set: { 
                stage: nextStage.name, 
                fasl: '',
                pendingPromotionFrom: '' 
              } 
            }
          );
          totalPromoted += result.modifiedCount;
        } else {
          const result = await Makhdoom.updateMany(
            { stage: currentStage.name },
            { 
              $set: { 
                stage: '', 
                fasl: '', 
                osra: '',
                pendingPromotionFrom: '' 
              } 
            }
          );
          totalPromoted += result.modifiedCount;
        }
      }
    }

    res.json({ success: true, count: totalPromoted });
  } catch (error) {
    console.error('Promotion error:', error);
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
