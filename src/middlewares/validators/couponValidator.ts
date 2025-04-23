import { check } from 'express-validator';
import validatorMiddleware from '../validatorMiddleware.js';

export const createCouponValidator = [
  check('name')
    .notEmpty()
    .withMessage('Coupon name is required')
    .bail()
    .isLength({ min: 3, max: 20 })
    .withMessage('Coupon name must consist of 3 to 20 characters')
    .trim()
    .toUpperCase(),
  check('expireAt')
    .notEmpty()
    .withMessage('Coupon expire time is required')
    .bail()
    .isDate()
    .withMessage('Please enter a valid date')
    .bail()
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expire date must be in the future');
      }
      return true;
    }),
  check('discount')
    .exists()
    .withMessage('Coupon discount value is required')
    .bail()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount value must be between 0 and 100'),
  validatorMiddleware,
];

export const getCouponValidator = [
  check('id').isMongoId().withMessage('Invalid coupon id format'),
  validatorMiddleware,
];

export const updateCouponValidator = [
  check('name')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Coupon name must consist of 3 to 20 characters')
    .trim()
    .toUpperCase(),
  check('expireAt')
    .optional()
    .isDate()
    .withMessage('Please enter a valid date')
    .bail()
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expire date must be in the future');
      }
      return true;
    }),
  check('discount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount value must be between 0 and 100'),
  validatorMiddleware,
];

export const deleteCouponValidator = [
  check('id').isMongoId().withMessage('Invalid coupon id format'),
  validatorMiddleware,
];
