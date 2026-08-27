import express from 'express';
import { getAttendance, saveAttendance } from '../controllers/attendanceController.js';

const router = express.Router();

router.get('/', getAttendance);
router.post('/', saveAttendance);

export default router;
