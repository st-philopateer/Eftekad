import mongoose from 'mongoose';

const preparationSubmissionSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    preparationId: { type: String, required: true, index: true },
    servantUsername: { type: String, required: true, index: true },
    fileName: { type: String, required: true },
    fileData: { type: String, required: true }, // relative path or base64
    uploadedAt: { type: String, default: () => new Date().toISOString() },
    score: { type: Number, default: undefined },
    comment: { type: String, default: undefined },
    evaluatedAt: { type: String, default: undefined },
    serviceYear: { type: String, default: '2026', index: true },
  },
  {
    timestamps: true,
    strict: false,
    collection: 'preparationSubmissions',
  }
);

preparationSubmissionSchema.index({ preparationId: 1, servantUsername: 1 });

const PreparationSubmission = mongoose.models.PreparationSubmission || mongoose.model('PreparationSubmission', preparationSubmissionSchema);
export default PreparationSubmission;
