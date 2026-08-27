import express from 'express';
import {
  getUsers,
  createUser,
  updateProfile,
  adminUpdateUser,
  updateProfilePic,
  deleteProfilePic,
  deleteUser,
} from '../controllers/userController.js';

const router = express.Router();

router.get('/', getUsers);
router.post('/', createUser);
router.post('/update-profile', updateProfile);
router.post('/admin-update', adminUpdateUser);
router.post('/profile-pic', updateProfilePic);
router.delete('/profile-pic', deleteProfilePic);
router.delete('/:username', deleteUser);

export default router;
