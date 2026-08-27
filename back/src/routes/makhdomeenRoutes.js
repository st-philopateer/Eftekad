import express from 'express';
import {
  getMakhdomeen,
  createMakhdoom,
  updateMakhdoom,
  deleteMakhdoom,
  batchUpdateMakhdomeen,
  renameClass,
  promoteMakhdoom,
} from '../controllers/makhdomeenController.js';

const router = express.Router();

router.get('/', getMakhdomeen);
router.post('/', createMakhdoom);
router.post('/batch-update', batchUpdateMakhdomeen);
router.post('/rename-class', renameClass);
router.put('/:id', updateMakhdoom);
router.delete('/:id', deleteMakhdoom);
router.post('/:id/promote', promoteMakhdoom);

export default router;
