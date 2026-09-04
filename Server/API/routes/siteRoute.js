import express from 'express';
import siteController from '../controller/siteController.js';
import authenticate from '../../middleware/authenticate.js';

const router = express.Router();

router.get('/', authenticate, siteController.list);
router.get('/:id', authenticate, siteController.getOne);
router.get('/:id/locations', authenticate, siteController.getOneWithLocations);
router.post('/', authenticate, siteController.create);
router.put('/:id', authenticate, siteController.update);
router.delete('/:id', authenticate, siteController.remove);

export default router;
