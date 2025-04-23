import { check } from 'express-validator';
import validatorMiddleware from '../validatorMiddleware.js';

export const getCategoryValidator = [
  // Creates a middleware/validation chain for one or more fields that may be located in any of the following:
  // req.body, req.cookies, req.headers, req.params, req.query
  check('id').isMongoId().withMessage('Invalid category id format'),

  validatorMiddleware,
];

export const getCategorySubcategoriesValidator = [
  check('categoryId').isMongoId().withMessage('Invalid category id format'),

  validatorMiddleware,
];

export const createCategoryValidator = [
  check('name')
    .notEmpty()
    .withMessage('Category name is required')
    .bail()
    .isLength({ min: 3 })
    .withMessage('Too short category name')
    .isLength({ max: 32 })
    .withMessage('Too long category name'),
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

export const updateCategoryValidator = [
  check('id').isMongoId().withMessage('Invalid category id format'),
  check('name')
    .optional()
    .isLength({ min: 3 })
    .withMessage('Too short category name')
    .isLength({ max: 32 })
    .withMessage('Too long category name'),
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

export const deleteCategoryValidator = [
  check('id').isMongoId().withMessage('Invalid category id format'),
  validatorMiddleware,
];
