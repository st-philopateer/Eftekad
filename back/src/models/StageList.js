import mongoose from 'mongoose';

const stageListSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    name: { type: String, required: true },
    order: { type: Number, default: 0 },
    nextStageId: { type: String, default: null },
    isGraduation: { type: Boolean, default: false },
    serviceYear: { type: String, default: '2026', index: true },
  },
  {
    timestamps: true,
    strict: false,
    collection: 'stagesList',
  }
);

const StageList = mongoose.models.StageList || mongoose.model('StageList', stageListSchema);
export default StageList;
