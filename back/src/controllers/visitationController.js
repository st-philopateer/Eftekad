import Visitation from '../models/Visitation.js';

export const saveServantVisitation = async (req, res) => {
  try {
    const { servantUsername, makhdoomId, weekDate, result, notes, serviceYear } = req.body;
    if (!servantUsername || !makhdoomId || !weekDate) {
      return res.status(400).json({ error: 'بيانات الافتقاد غير مكتملة' });
    }

    const updated = await Visitation.findOneAndUpdate(
      { servantUsername, makhdoomId, weekDate },
      {
        $set: {
          result: result || 'answered',
          notes: notes || '',
          scannedAt: new Date().toISOString(),
          serviceYear: serviceYear || '2026',
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, visitation: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
