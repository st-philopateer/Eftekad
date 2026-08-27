import mongoose from 'mongoose';

const makhdoomSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    name: { type: String, required: true, trim: true, index: true },
    gender: { type: String, default: 'male' },
    osra: { type: String, default: '', index: true },
    stage: { type: String, default: '', index: true },
    fasl: { type: String, default: '', index: true },
    phone: { type: String, default: '', trim: true },
    phoneNumber: { type: String, default: '', trim: true },
    address: { type: String, default: '' },
    area: { type: String, default: '' },
    street: { type: String, default: '' },
    building: { type: String, default: '' },
    floor: { type: String, default: '' },
    apartment: { type: String, default: '' },
    notes: { type: String, default: '' },
    serviceYear: { type: String, default: '2026', index: true },
    status: { type: String, default: 'active', index: true },
    assignedServant: { type: String, default: null, index: true },
    code: { type: String, default: '' },
    timestamp: { type: String, default: () => new Date().toISOString() },
  },
  {
    timestamps: true,
    strict: false,
    collection: 'makhdomeen',
  }
);

makhdoomSchema.index({ serviceYear: 1, osra: 1, stage: 1, fasl: 1 });
makhdoomSchema.index({ assignedServant: 1, serviceYear: 1 });

const Makhdoom = mongoose.models.Makhdoom || mongoose.model('Makhdoom', makhdoomSchema);
export default Makhdoom;
