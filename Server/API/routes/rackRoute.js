import express from 'express';
import rackController from '../controller/rackController.js';
import authenticate from '../../middleware/authenticate.js';

const router = express.Router();

router.get('/', authenticate, rackController.list);
router.get('/:id', authenticate, rackController.getOne);
router.get('/:id/contents', authenticate, rackController.getOneWithContents);
router.post('/', authenticate, rackController.create);
router.put('/:id', authenticate, rackController.update);
router.delete('/:id', authenticate, rackController.remove);

export default router;
