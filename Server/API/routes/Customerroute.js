import express from 'express';
import customerController from '../controller/customerController.js';

const router = express.Router();

router.get('/', customerController.list);
router.get('/:id/overview', customerController.getOverview);
router.get('/:id', customerController.getOne);
router.get('/:id/sites', customerController.getOneWithSites);
router.post('/', customerController.create);
router.put('/:id', customerController.update);
router.delete('/:id', customerController.remove);

export default router;