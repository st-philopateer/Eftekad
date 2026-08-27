import mongoose from 'mongoose';

const serviceTreeSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    name: { type: String, required: true },
    type: { type: String, default: 'primary' },
    color: { type: String, default: '#c9a84c' },
    serviceYear: { type: String, default: '2026', index: true },
    serviceDay: { type: String, default: 'Friday' },
    osras: { type: Array, default: [] },
  },
  {
    timestamps: true,
    strict: false,
    collection: 'priestServices',
  }
);

const ServiceTree = mongoose.models.ServiceTree || mongoose.model('ServiceTree', serviceTreeSchema);
export default ServiceTree;
