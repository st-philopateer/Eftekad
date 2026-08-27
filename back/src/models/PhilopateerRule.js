import mongoose from 'mongoose';

const philopateerRuleSchema = new mongoose.Schema(
  {
    serviceType: { type: String, required: true, unique: true, index: true }, // poster, video, montage, office, photography
    minDaysRequired: { type: Number, default: 3 },
    description: { type: String, default: '' }
  },
  {
    timestamps: true,
    collection: 'philopateer_rules'
  }
);

const PhilopateerRule = mongoose.models.PhilopateerRule || mongoose.model('PhilopateerRule', philopateerRuleSchema);
export default PhilopateerRule;
