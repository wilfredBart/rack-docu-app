import express from 'express';
import vlanController from '../controller/vlanController.js';
import authenticate from '../../middleware/authenticate.js';

const router = express.Router();

router.get('/', authenticate, vlanController.list);
router.post('/', authenticate, vlanController.create);
router.put('/:id', authenticate, vlanController.update);
router.delete('/:id', authenticate, vlanController.remove);

export default router;
