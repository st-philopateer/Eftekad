import mongoose from 'mongoose';

const lessonPreparationSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    lessonName: { type: String, required: true },
    objectives: { type: String, default: '' },
    deadline: { type: String, default: '' },
    serviceName: { type: String, default: 'all', index: true },
    className: { type: String, default: 'all', index: true },
    stageName: { type: String, default: 'all', index: true },
    serviceYear: { type: String, default: '2026', index: true },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  {
    timestamps: true,
    strict: false,
    collection: 'preparations',
  }
);

lessonPreparationSchema.index({ serviceYear: 1, serviceName: 1 });

const LessonPreparation = mongoose.models.LessonPreparation || mongoose.model('LessonPreparation', lessonPreparationSchema);
export default LessonPreparation;
