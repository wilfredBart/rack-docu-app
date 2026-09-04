import express from 'express';
import deviceController from '../controller/deviceController.js';
import authenticate from '../../middleware/authenticate.js';

const router = express.Router();

router.get('/', authenticate, deviceController.list);
router.get('/:id', authenticate, deviceController.getOne);
router.get('/:id/ports', authenticate, deviceController.getOneWithPorts);
router.post('/', authenticate, deviceController.create);
router.put('/:id', authenticate, deviceController.update);
router.delete('/:id', authenticate, deviceController.remove);

export default router;
