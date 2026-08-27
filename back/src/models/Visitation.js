import mongoose from 'mongoose';

const visitationSchema = new mongoose.Schema(
  {
    servantUsername: { type: String, required: true, index: true },
    makhdoomId: { type: String, required: true, index: true },
    weekDate: { type: String, required: true, index: true },
    result: { type: String, default: 'answered' },
    notes: { type: String, default: '' },
    scannedAt: { type: String, default: () => new Date().toISOString() },
    serviceYear: { type: String, default: '2026', index: true },
  },
  {
    timestamps: true,
    strict: false,
    collection: 'servantVisitations',
  }
);

visitationSchema.index({ servantUsername: 1, makhdoomId: 1, weekDate: 1 });

const Visitation = mongoose.models.Visitation || mongoose.model('Visitation', visitationSchema);
export default Visitation;
