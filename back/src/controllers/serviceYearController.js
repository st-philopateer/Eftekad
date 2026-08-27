import ServiceYear from '../models/ServiceYear.js';

export const getServiceYears = async (req, res) => {
  try {
    const list = await ServiceYear.find({}).lean();
    res.json({ success: true, serviceYears: list });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createServiceYear = async (req, res) => {
  try {
    const { year, isActive } = req.body;
    if (!year) return res.status(400).json({ error: 'السنة مطلوبة' });

    const existing = await ServiceYear.findOne({ year });
    if (existing) return res.status(400).json({ error: 'سنة الخدمة موجودة بالفعل' });

    const newYear = await ServiceYear.create({
      year: year.toString(),
      isActive: !!isActive,
    });
    res.status(201).json(newYear);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateServiceYear = async (req, res) => {
  try {
    const { oldYear } = req.params;
    const { year, isActive } = req.body;

    const updated = await ServiceYear.findOneAndUpdate(
      { year: oldYear },
      { $set: { year: year || oldYear, isActive: !!isActive } },
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteServiceYear = async (req, res) => {
  try {
    const { year } = req.params;
    await ServiceYear.findOneAndDelete({ year });
    res.json({ success: true, message: 'تم حذف سنة الخدمة بنجاح' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
