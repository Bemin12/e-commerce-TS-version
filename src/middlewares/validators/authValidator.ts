import { check } from 'express-validator';
import validatorMiddleware from '../validatorMiddleware.js';
// const User = require('../../models/userModel');

export const signupValidator = [
  check('name').notEmpty().withMessage('Please provide a name').trim(),
  check('email')
    .notEmpty()
    .withMessage('Please provide your email')
    .bail()
    .isEmail()
    .withMessage('Please provide a valid email'),
  // .custom(async (email) => {
  //   const existingUser = await User.findOne({ email });
  //   if (existingUser) {
  //     throw new Error('There is already user with this email');
  //   }
  // }),
  check('phone').optional().isMobilePhone('any').withMessage('Please provide a valid phone number'),
  check('password')
    .notEmpty()
    .withMessage('Please provide a password')
    .bail()
    .isLength({ min: 6 })
    .withMessage('Too short password'),
  check('passwordConfirm')
    .notEmpty()
    .withMessage('Please confirm your password')
    .bail()
    .custom((val, { req }) => val === req.body.password)
    .withMessage('password and passwordConfirm are not the same'),
  check('profileImg')
    .optional()
    .matches(/\.(jpg|jpeg|png)$/)
    .withMessage('Profile image must be jpg, jpeg, or png format'),
  validatorMiddleware,
];

export const loginValidator = [
  check('email')
    .notEmpty()
    .withMessage('Please provide your email')
    .bail()
    .isEmail()
    .withMessage('Please provide a valid email'),
  check('password').notEmpty().withMessage('Please provide a password'),

  validatorMiddleware,
];

export const updatePasswordValidator = [
  check('passwordCurrent').notEmpty().withMessage('Please provide current password'),
  check('password')
    .notEmpty()
    .withMessage('Please provide new password')
    .bail()
    .isLength({ min: 6 })
    .withMessage('Too short password'),
  check('passwordConfirm')
    .notEmpty()
    .withMessage('Please confirm new password')
    .bail()
    .custom((val, { req }) => val === req.body.password)
    .withMessage('password and passwordConfirm are not the same'),
  validatorMiddleware,
];

export const resetPasswordValidator = [
  // check('token').notEmpty().withMessage('Reset token is required'),
  check('email').notEmpty().withMessage('Please provide email'),
  check('password')
    .notEmpty()
    .withMessage('Please provide new password')
    .bail()
    .isLength({ min: 6 })
    .withMessage('Too short password'),
  check('passwordConfirm')
    .notEmpty()
    .withMessage('Please confirm new password')
    .bail()
    .custom((val, { req }) => val === req.body.password)
    .withMessage('password and passwordConfirm are not the same'),
  validatorMiddleware,
];

export const forgotPasswordValidator = [
  check('email')
    .notEmpty()
    .withMessage('Provide the email')
    .bail()
    .isEmail()
    .withMessage('Please provide a valid email'),
  validatorMiddleware,
];
