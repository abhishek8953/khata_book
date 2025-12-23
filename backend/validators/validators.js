import { body, validationResult } from 'express-validator';

export const validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('phone')
    .matches(/^[0-9]{10}$/)
    .withMessage('Valid phone number is required'),
  body('businessName').trim().notEmpty().withMessage('Business name is required'),
];

export const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const validateCustomer = [
  body('name').trim().notEmpty().withMessage('Customer name is required'),
  body('phone')
    .matches(/^[0-9]{10}$/)
    .withMessage('Valid phone number is required'),
];

export const validateProduct = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('unit')
    .isIn(['kg', 'liter', 'piece', 'gram', 'ml'])
    .withMessage('Valid unit is required'),
];

export const validateTransaction = [
  body('customerId').notEmpty().withMessage('Customer ID is required'),
  body('type')
    .isIn(['purchase', 'payment'])
    .withMessage('Valid transaction type is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};
