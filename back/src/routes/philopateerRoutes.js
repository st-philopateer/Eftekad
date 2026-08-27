import express from 'express';
import {
  getRules,
  saveRule,
  getRequests,
  createRequest,
  updateRequestStatus,
  markRequestsSeen
} from '../controllers/philopateerController.js';

const router = express.Router();

router.get('/rules', getRules);
router.post('/rules', saveRule);
router.get('/requests', getRequests);
router.post('/requests', createRequest);
router.put('/requests/:requestId/status', updateRequestStatus);
router.post('/requests/seen', markRequestsSeen);

export default router;
