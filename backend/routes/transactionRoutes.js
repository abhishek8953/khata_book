import express from 'express';
import {
  addTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  sendBalanceNotification,
  getDashboardStats,
} from '../controllers/transactionController.js';
import { validateTransaction, handleValidationErrors } from '../validators/validators.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', validateTransaction, handleValidationErrors, addTransaction);
router.get('/', getTransactions);
router.get('/stats/dashboard', getDashboardStats);
router.get('/:id', getTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);
router.post('/:customerId/send-sms', sendBalanceNotification);

export default router;
