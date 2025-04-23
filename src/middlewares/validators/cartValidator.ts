import { check } from 'express-validator';
import validatorMiddleware from '../validatorMiddleware.js';

export const addProductToCartValidator = [
  check('productId')
    .notEmpty()
    .withMessage('Product id is required')
    .bail()
    .isMongoId()
    .withMessage('Invalid product id format'),
  check('quantity').optional().isInt({ min: 1 }).withMessage('quantity must be a positive number'),
  check('color').optional().isString(),
  validatorMiddleware,
];

export const removeSpecificCartItemValidator = [
  check('itemId').isMongoId().withMessage('Invalid item id format'),
  validatorMiddleware,
];

export const updateCartItemQuantityValidator = [
  check('itemId').isMongoId().withMessage('Invalid item id format'),
  check('quantity')
    .exists()
    .withMessage('Quantity is required')
    .bail()
    .isInt({ min: 1 })
    .withMessage('quantity must be a positive number'),
  validatorMiddleware,
];
