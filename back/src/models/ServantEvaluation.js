import mongoose from 'mongoose';

const servantEvaluationSchema = new mongoose.Schema(
  {
    templateId: { type: String, required: true, index: true },
    servantUsername: { type: String, required: true, index: true },
    weekDate: { type: String, required: true, index: true },
    value: { type: mongoose.Schema.Types.Mixed, default: false },
    scannedAt: { type: String, default: () => new Date().toISOString() },
    serviceYear: { type: String, default: '2026', index: true },
  },
  {
    timestamps: true,
    strict: false,
    collection: 'servantEvaluations',
  }
);

servantEvaluationSchema.index({ servantUsername: 1, templateId: 1, weekDate: 1 });

const ServantEvaluation = mongoose.models.ServantEvaluation || mongoose.model('ServantEvaluation', servantEvaluationSchema);
export default ServantEvaluation;
