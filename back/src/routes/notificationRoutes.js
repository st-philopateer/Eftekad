import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getSyncMessages,
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', getNotifications);
router.post('/:id/read', markAsRead);
router.post('/read-all', markAllAsRead);
router.get('/sync-messages', getSyncMessages);

export default router;
