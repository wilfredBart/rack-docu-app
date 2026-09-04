import express from 'express';
import authController from '../controller/authController.js';
import authenticate from '../../middleware/authenticate.js';
import localOnly from '../../middleware/localOnly.js';

const router = express.Router();

router.get('/setup-status', authController.setupStatus);
router.post('/setup', authController.setup);
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/recovery-reset', localOnly, authController.recoveryReset);
router.get('/me', authenticate, authController.me);

export default router;
