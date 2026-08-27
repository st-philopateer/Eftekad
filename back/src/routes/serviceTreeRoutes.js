import express from 'express';
import {
  getServices,
  saveServices,
  updateSettings,
  transferRequest,
  transferAccept,
  distributeWaznat,
} from '../controllers/serviceTreeController.js';

const router = express.Router();

router.get('/', getServices);
router.post('/', saveServices);
router.post('/update-settings', updateSettings);
router.post('/transfer-request', transferRequest);
router.post('/transfer-accept', transferAccept);
router.post('/distribute-waznat', distributeWaznat);

export default router;
