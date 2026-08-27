import User from '../models/User.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const userData = req.body;
    if (!userData.username || !userData.name) {
      return res.status(400).json({ error: 'اسم المستخدم والاسم مطلوبان' });
    }

    const cleanUsername = userData.username.trim().toLowerCase();
    const existing = await User.findOne({ username: cleanUsername });
    if (existing) {
      return res.status(400).json({ error: 'اسم المستخدم مسجل بالفعل' });
    }

    const newUser = await User.create({
      ...userData,
      username: cleanUsername,
      id: userData.id || Date.now().toString(),
    });

    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { username, name, email, password } = req.body;
    if (!username) return res.status(400).json({ error: 'اسم المستخدم مطلوب' });

    const cleanUsername = username.trim().toLowerCase();
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email !== undefined) updateFields.email = email;
    if (password) updateFields.password = password;

    const updatedUser = await User.findOneAndUpdate(
      { username: cleanUsername },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ error: 'المستخدم غير موجود' });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const adminUpdateUser = async (req, res) => {
  try {
    const { username, ...updates } = req.body;
    if (!username) return res.status(400).json({ error: 'اسم المستخدم مطلوب' });

    const cleanUsername = username.trim().toLowerCase();
    const updatedUser = await User.findOneAndUpdate(
      { username: cleanUsername },
      { $set: updates },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ error: 'المستخدم غير موجود' });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfilePic = async (req, res) => {
  try {
    const { username, profilePic } = req.body;
    if (!username) return res.status(400).json({ error: 'اسم المستخدم مطلوب' });

    const cleanUsername = username.trim().toLowerCase();
    const updatedUser = await User.findOneAndUpdate(
      { username: cleanUsername },
      { $set: { profilePic } },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ error: 'المستخدم غير موجود' });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProfilePic = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'اسم المستخدم مطلوب' });

    const cleanUsername = username.trim().toLowerCase();
    const updatedUser = await User.findOneAndUpdate(
      { username: cleanUsername },
      { $set: { profilePic: '' } },
      { new: true }
    );

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { username } = req.params;
    if (!username) return res.status(400).json({ error: 'اسم المستخدم مطلوب' });

    await User.findOneAndDelete({ username: username.trim().toLowerCase() });
    res.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
