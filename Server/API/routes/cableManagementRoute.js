import express from 'express';
import cableManagementController from '../controller/cableManagementController.js';
import authenticate from '../../middleware/authenticate.js';

const router = express.Router();

router.get('/', authenticate, cableManagementController.list);
router.get('/:id', authenticate, cableManagementController.getOne);
router.post('/', authenticate, cableManagementController.create);
router.put('/:id', authenticate, cableManagementController.update);
router.delete('/:id', authenticate, cableManagementController.remove);

export default router;
