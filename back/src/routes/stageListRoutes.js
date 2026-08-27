import express from 'express';
import {
  getStagesList,
  createStage,
  updateStage,
  deleteStage,
  promoteStage,
} from '../controllers/stageListController.js';

const router = express.Router();

router.get('/', getStagesList);
router.post('/', createStage);
router.put('/:id', updateStage);
router.delete('/:id', deleteStage);
router.post('/promote', promoteStage);

export default router;
