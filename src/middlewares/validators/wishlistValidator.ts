import { check } from 'express-validator';
import validatorMiddleware from '../validatorMiddleware.js';

import Product from '../../models/productModel.js';

export const addProductToWishlistValidator = [
  check('productId')
    .notEmpty()
    .withMessage('Product id is required')
    .bail()
    .isMongoId()
    .withMessage('Invalid product id format')
    .bail()
    .custom(async (val) => {
      const product = await Product.findById(val);
      if (!product) {
        throw new Error('No product found with this id');
      }
    }),
  validatorMiddleware,
];

export const removeProductFromWishlistValidator = [
  check('productId')
    .notEmpty()
    .withMessage('Product id is required')
    .bail()
    .isMongoId()
    .withMessage('Invalid product id format'),
  validatorMiddleware,
];
