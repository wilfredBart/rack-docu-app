import express from 'express';
import patchPanelController from '../controller/patchPanelController.js';
import authenticate from '../../middleware/authenticate.js';

const router = express.Router();

router.get('/', authenticate, patchPanelController.list);
router.get('/:id', authenticate, patchPanelController.getOne);
router.get('/:id/ports', authenticate, patchPanelController.getOneWithPorts);
router.post('/', authenticate, patchPanelController.create);
router.put('/:id', authenticate, patchPanelController.update);
router.delete('/:id', authenticate, patchPanelController.remove);

export default router;
