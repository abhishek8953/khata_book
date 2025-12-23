import express from 'express';
import {
  addCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerBalance,
} from '../controllers/customerController.js';
import { validateCustomer, handleValidationErrors } from '../validators/validators.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', validateCustomer, handleValidationErrors, addCustomer);
router.get('/', getCustomers);
router.get('/:id', getCustomer);
router.put('/:id', validateCustomer, handleValidationErrors, updateCustomer);
router.delete('/:id', deleteCustomer);
router.get('/:id/balance', getCustomerBalance);

export default router;
