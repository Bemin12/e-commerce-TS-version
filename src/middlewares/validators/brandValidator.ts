import { check } from 'express-validator';
import validatorMiddleware from '../validatorMiddleware.js';

export const getBrandValidator = [
  check('id').isMongoId().withMessage('Invalid brand id format'),
  validatorMiddleware,
];

export const createBrandValidator = [
  check('name')
    .notEmpty()
    .withMessage('Brand name is required')
    .bail()
    .isLength({ min: 3 })
    .withMessage('Too short brand name')
    .isLength({ max: 32 })
    .withMessage('Too long brand name'),
  // check('image')
  //   .optional()
  //   .matches(/\.(jpg|jpeg|png)$/i)
  //   .withMessage('Image must be jpg, jpeg, or png format'),
  check('image').custom((value, { req }) => {
    if (value === '') throw new Error("Don't provide empty image");

    if (req.file) {
      if (!/\.(jpg|jpeg|png)$/i.test(req.file.originalname)) {
        throw new Error('Image must be jpg, jpeg, or png format');
      }
    }

    return true;
  }),
  validatorMiddleware,
];

export const updateBrandValidator = [
  check('id').isMongoId().withMessage('Invalid brand id format'),
  check('name')
    .optional()
    .isLength({ min: 3 })
    .withMessage('Too short brand name')
    .isLength({ max: 32 })
    .withMessage('Too long brand name'),
  // check('image')
  //   .optional()
  //   .matches(/\.(jpg|jpeg|png)$/i)
  //   .withMessage('Image must be jpg, jpeg, or png format'),
  check('image').custom((value, { req }) => {
    if (value === '') throw new Error("Don't provide empty image");

    if (req.file) {
      if (!/\.(jpg|jpeg|png)$/i.test(req.file.originalname)) {
        throw new Error('Image must be jpg, jpeg, or png format');
      }
    }

    return true;
  }),

  validatorMiddleware,
];

export const deleteBrandValidator = [
  check('id').isMongoId().withMessage('Invalid brand id format'),
  validatorMiddleware,
];
