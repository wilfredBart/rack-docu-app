import express from 'express';
import locationController from '../controller/locationController.js';
import authenticate from '../../middleware/authenticate.js';

const router = express.Router();

router.get('/', authenticate, locationController.list);
router.get('/:id', authenticate, locationController.getOne);
router.get('/:id/racks', authenticate, locationController.getOneWithRacks);
router.post('/', authenticate, locationController.create);
router.put('/:id', authenticate, locationController.update);
router.delete('/:id', authenticate, locationController.remove);

export default router;
