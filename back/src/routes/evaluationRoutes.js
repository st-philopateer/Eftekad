import express from 'express';
import {
  getEvaluations,
  saveEvaluation,
  getEvaluationTemplates,
  createEvaluationTemplate,
  updateEvaluationTemplate,
  deleteEvaluationTemplate,
  getServantEvaluations,
  saveServantEvaluation,
  scanServantEvaluation,
} from '../controllers/evaluationController.js';

const router = express.Router();

// General evaluations
router.get('/evaluations', getEvaluations);
router.post('/evaluations', saveEvaluation);

// Templates
router.get('/evaluation-templates', getEvaluationTemplates);
router.post('/evaluation-templates', createEvaluationTemplate);
router.put('/evaluation-templates/:id', updateEvaluationTemplate);
router.delete('/evaluation-templates/:id', deleteEvaluationTemplate);

// Servant Evaluations & QR Scanning
router.get('/servant-evaluations', getServantEvaluations);
router.post('/servant-evaluations', saveServantEvaluation);
router.post('/servant-evaluations/scan', scanServantEvaluation);

export default router;
