import Attendance from '../models/Attendance.js';

export const getAttendance = async (req, res) => {
  try {
    const { year, serviceName, className, date } = req.query;
    const filter = {};
    if (year) filter.serviceYear = year;
    if (serviceName) filter.serviceName = serviceName;
    if (className) filter.className = className;
    if (date) filter.date = date;

    const list = await Attendance.find(filter).lean();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const saveAttendance = async (req, res) => {
  try {
    const { serviceName, className, stageName, date, records, serviceYear } = req.body;
    if (!serviceName || !className || !date) {
      return res.status(400).json({ error: 'الخدمة والفصل والتاريخ مطلوبون' });
    }

    const updated = await Attendance.findOneAndUpdate(
      { serviceName, className, date },
      {
        $set: {
          records: records || {},
          stageName: stageName || '',
          serviceYear: serviceYear || '2026',
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, attendance: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
