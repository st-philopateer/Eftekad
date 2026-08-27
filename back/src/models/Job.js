import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    title: { type: String, default: '' },
    name: { type: String, default: '' },
    order: { type: Number, default: 0 },
    serviceYear: { type: String, default: '2026', index: true },
  },
  {
    timestamps: true,
    strict: false,
    collection: 'jobs',
  }
);

const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);
export default Job;
