import express from 'express';
import { login, forgotPassword } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/priests/forgot-password', forgotPassword);

export default router;
