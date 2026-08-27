import mongoose from 'mongoose';

const evaluationTemplateSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    name: { type: String, required: true },
    type: { type: String, default: 'checkbox' }, // checkbox, percentage, qr_liturgy, visitation
    serviceName: { type: String, default: 'all', index: true },
    className: { type: String, default: 'all', index: true },
    stageName: { type: String, default: 'all', index: true },
    targetDay: { type: String, default: 'Friday' },
    serviceYear: { type: String, default: '2026', index: true },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    strict: false,
    collection: 'evaluationTemplates',
  }
);

evaluationTemplateSchema.index({ serviceYear: 1, serviceName: 1 });

const EvaluationTemplate = mongoose.models.EvaluationTemplate || mongoose.model('EvaluationTemplate', evaluationTemplateSchema);
export default EvaluationTemplate;
