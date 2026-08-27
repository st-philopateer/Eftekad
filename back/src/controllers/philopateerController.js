import PhilopateerRule from '../models/PhilopateerRule.js';
import PhilopateerRequest from '../models/PhilopateerRequest.js';

// Get all rules (or seed default if empty)
export const getRules = async (req, res) => {
  try {
    let rules = await PhilopateerRule.find({}).lean();
    const defaults = [
      { serviceType: 'poster', minDaysRequired: 3, description: 'انشاء البوسترات' },
      { serviceType: 'video', minDaysRequired: 5, description: 'انشاء فيديو' },
      { serviceType: 'montage', minDaysRequired: 4, description: 'مونتاج' },
      { serviceType: 'office', minDaysRequired: 2, description: 'اوفيس' },
      { serviceType: 'photography', minDaysRequired: 3, description: 'تصوير' },
      { serviceType: 'sound', minDaysRequired: 3, description: 'خدمات الصوت والساوند' },
      { serviceType: 'terms', minDaysRequired: 0, description: 'الشروط والأحكام الخاصة بخدمة سان فيلوباتير' }
    ];
    let needsSeed = false;
    for (const def of defaults) {
      if (!rules.some(r => r.serviceType === def.serviceType)) {
        await PhilopateerRule.create(def);
        needsSeed = true;
      }
    }
    if (needsSeed || rules.length === 0) {
      rules = await PhilopateerRule.find({}).lean();
    }
    res.json({ success: true, rules });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Save or update a rule
export const saveRule = async (req, res) => {
  try {
    const { serviceType, minDaysRequired, description } = req.body;
    if (!serviceType) {
      return res.status(400).json({ error: 'نوع الخدمة مطلوب' });
    }
    const updated = await PhilopateerRule.findOneAndUpdate(
      { serviceType },
      { $set: { minDaysRequired, description } },
      { upsert: true, new: true }
    );
    res.json({ success: true, rule: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get requests
export const getRequests = async (req, res) => {
  try {
    const { requesterUsername } = req.query;
    const filter = {};
    if (requesterUsername) {
      filter.requesterUsername = requesterUsername.trim().toLowerCase();
    }
    const list = await PhilopateerRequest.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, requests: list });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new request
export const createRequest = async (req, res) => {
  try {
    const data = req.body;
    if (!data.requestType || !data.requesterUsername || !data.requiredDate) {
      return res.status(400).json({ error: 'بيانات الطلب غير مكتملة' });
    }
    const newRequest = await PhilopateerRequest.create({
      ...data,
      requesterUsername: data.requesterUsername.trim().toLowerCase()
    });
    res.status(201).json({ success: true, request: newRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update request status
export const updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'الحالة مطلوبة' });
    }
    const updated = await PhilopateerRequest.findByIdAndUpdate(
      requestId,
      { $set: { status } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'الطلب غير موجود' });
    }
    res.json({ success: true, request: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark requests as seen
export const markRequestsSeen = async (req, res) => {
  try {
    await PhilopateerRequest.updateMany({ seen: false }, { $set: { seen: true } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
