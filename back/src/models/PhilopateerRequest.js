import mongoose from 'mongoose';

const philopateerRequestSchema = new mongoose.Schema(
  {
    requestType: { type: String, required: true, index: true }, // poster, video, montage, office, photography, sound
    requesterUsername: { type: String, required: true, index: true },
    requesterName: { type: String, required: true },
    requesterOsra: { type: String, default: '' },
    details: { type: String, default: '' },
    requiredDate: { type: String, required: true }, // YYYY-MM-DD
    files: { type: [String], default: [] }, // base64 strings or file paths
    photographyDetails: {
      whatToPhotograph: { type: String, default: '' },
      timings: { type: String, default: '' },
      hasFullEquipment: { type: Boolean, default: false }
    },
    status: { type: String, default: 'pending', index: true }, // pending, approved, rejected, in_progress
    seen: { type: Boolean, default: false, index: true }
  },
  {
    timestamps: true,
    collection: 'philopateer_requests'
  }
);

const PhilopateerRequest = mongoose.models.PhilopateerRequest || mongoose.model('PhilopateerRequest', philopateerRequestSchema);
export default PhilopateerRequest;
