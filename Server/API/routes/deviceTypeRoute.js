import express from 'express';
import deviceTypeController from '../controller/deviceTypeController.js';
import authenticate from '../../middleware/authenticate.js';

const router = express.Router();

router.get('/', authenticate, deviceTypeController.list);
router.post('/', authenticate, deviceTypeController.create);

export default router;
