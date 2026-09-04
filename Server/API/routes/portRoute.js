import express from 'express';
import portController from '../controller/portController.js';
import authenticate from '../../middleware/authenticate.js';

const router = express.Router();

router.get('/', authenticate, portController.list);
router.get('/:id', authenticate, portController.getOne);
router.post('/bulk', authenticate, portController.bulkCreate);
router.post('/', authenticate, portController.create);
router.put('/:id', authenticate, portController.update);
router.delete('/bulk', authenticate, portController.bulkRemove);
router.delete('/:id', authenticate, portController.remove);

export default router;
