import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    serviceName: { type: String, required: true, index: true },
    className: { type: String, required: true, index: true },
    stageName: { type: String, default: '', index: true },
    date: { type: String, required: true, index: true },
    records: { type: Object, default: {} },
    serviceYear: { type: String, default: '2026', index: true },
  },
  {
    timestamps: true,
    strict: false,
    collection: 'attendance',
  }
);

attendanceSchema.index({ serviceName: 1, className: 1, date: 1 });

const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
export default Attendance;
