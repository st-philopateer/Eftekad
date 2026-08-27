import mongoose from 'mongoose';

const serviceYearSchema = new mongoose.Schema(
  {
    year: { type: String, required: true, unique: true, index: true },
    isActive: { type: Boolean, default: false },
    archivedAt: { type: String, default: null },
  },
  {
    timestamps: true,
    strict: false,
    collection: 'serviceYears',
  }
);

const ServiceYear = mongoose.models.ServiceYear || mongoose.model('ServiceYear', serviceYearSchema);
export default ServiceYear;
