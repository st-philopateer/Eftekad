import User from '../models/User.js';

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
    }

    const cleanUser = username.trim().toLowerCase();
    const user = await User.findOne({
      $or: [
        { username: cleanUser },
        { username: username.trim() },
        { email: cleanUser }
      ]
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ error: 'تم حظر هذا الحساب، يرجى مراجعة المسؤول' });
    }

    res.json({
      success: true,
      user: {
        id: user.id || user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        church: user.church,
        email: user.email,
        profilePic: user.profilePic,
        osra: user.osra,
        rolesList: user.rolesList || [],
        permissions: user.permissions || {},
        assignedStage: user.assignedStage,
        assignedClass: user.assignedClass,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'لم يتم العثور على حساب مسجل بهذا البريد' });
    }

    // In production, send email reset code. For now return success response.
    res.json({ success: true, message: 'تم إرسال تعليمات استعادة كلمة المرور إلى بريدك الإلكتروني' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
