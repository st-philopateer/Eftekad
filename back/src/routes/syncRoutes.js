import express from 'express';
import {
  getFullSync,
  getSyncVersions,
  getSyncByKey,
  postSync,
  postSyncDelta,
  getArchivedReports,
  adminDiagnose,
} from '../controllers/syncController.js';

const router = express.Router();

router.get('/sync', getFullSync);
router.get('/sync/versions', getSyncVersions);
router.get('/sync/key/:key', getSyncByKey);
router.post('/sync', postSync);
router.post('/sync/delta', postSyncDelta);

router.get('/reports/archived', getArchivedReports);
router.get('/admin/diagnose', adminDiagnose);

export default router;
