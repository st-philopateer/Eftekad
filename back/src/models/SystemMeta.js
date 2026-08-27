import mongoose from 'mongoose';

const systemMetaSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  {
    timestamps: true,
    strict: false,
    collection: 'meta',
  }
);

const SystemMeta = mongoose.models.SystemMeta || mongoose.model('SystemMeta', systemMetaSchema);
export default SystemMeta;
