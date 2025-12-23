import express from 'express';
import {
  addProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { validateProduct, handleValidationErrors } from '../validators/validators.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', validateProduct, handleValidationErrors, addProduct);
router.get('/', getProducts);
router.get('/:id', getProduct);
router.put('/:id', validateProduct, handleValidationErrors, updateProduct);
router.delete('/:id', deleteProduct);

export default router;
