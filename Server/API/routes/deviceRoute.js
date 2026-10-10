import express from 'express';
import deviceController from '../controller/deviceController.js';
import authenticate from '../../middleware/authenticate.js';

const router = express.Router();

router.get('/', authenticate, deviceController.list);
router.get('/:id', authenticate, deviceController.getOne);
router.get('/:id/ports', authenticate, deviceController.getOneWithPorts);
router.get('/:id/patchplan', authenticate, deviceController.getPatchPlan);
router.post('/', authenticate, deviceController.create);
router.put('/:id', authenticate, deviceController.update);
router.patch('/:id/position', authenticate, deviceController.move);
router.delete('/:id', authenticate, deviceController.remove);

export default router;
