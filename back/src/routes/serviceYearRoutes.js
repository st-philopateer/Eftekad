import express from 'express';
import {
  getServiceYears,
  createServiceYear,
  updateServiceYear,
  deleteServiceYear,
} from '../controllers/serviceYearController.js';

const router = express.Router();

router.get('/', getServiceYears);
router.post('/', createServiceYear);
router.put('/:oldYear', updateServiceYear);
router.delete('/:year', deleteServiceYear);

export default router;
