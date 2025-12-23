import express from 'express';
import { register, login, refreshAccessToken, getSeller, updateSeller } from '../controllers/authController.js';
import {
  validateRegister,
  validateLogin,
  handleValidationErrors,
} from '../validators/validators.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', validateRegister, handleValidationErrors, register);
router.post('/login', validateLogin, handleValidationErrors, login);
router.post('/refresh', refreshAccessToken);
router.get('/seller', authMiddleware, getSeller);
router.put('/seller', authMiddleware, updateSeller);

export default router;
