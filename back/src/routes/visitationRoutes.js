import express from 'express';
import { saveServantVisitation } from '../controllers/visitationController.js';

const router = express.Router();

router.post('/', saveServantVisitation);

export default router;
