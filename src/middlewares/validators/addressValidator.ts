import { check } from 'express-validator';
import validatorMiddleware from '../validatorMiddleware.js';

export const addAddressValidator = [
  check('phone').isMobilePhone('any').withMessage('Please provide a valid phone number'),
  check('postalCode').isPostalCode('any').withMessage('Please provide a valid postal code'),
  validatorMiddleware,
];

export const removeAddressValidator = [
  check('addressId')
    .notEmpty()
    .withMessage('address id is required')
    .bail()
    .isMongoId()
    .withMessage('Invalid address id format'),
  validatorMiddleware,
];
