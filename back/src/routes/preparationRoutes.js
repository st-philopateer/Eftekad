import express from 'express';
import {
  getPreparations,
  createPreparation,
  deletePreparation,
  getSubmissions,
  submitPreparation,
  evaluateSubmission,
} from '../controllers/preparationController.js';

const router = express.Router();

router.get('/', getPreparations);
router.post('/', createPreparation);
router.delete('/:id', deletePreparation);

router.get('/submissions', getSubmissions);
router.post('/submit', submitPreparation);
router.post('/submissions/:id/evaluate', evaluateSubmission);

export default router;
