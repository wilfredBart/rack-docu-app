import express from 'express';
import connectionController from '../controller/connectionController.js';
import authenticate from '../../middleware/authenticate.js';

const router = express.Router();

router.get('/', authenticate, connectionController.list);
router.get('/:id', authenticate, connectionController.getOne);
router.post('/', authenticate, connectionController.create);
router.put('/:id', authenticate, connectionController.update);
router.delete('/:id', authenticate, connectionController.remove);

export default router;
