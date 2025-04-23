// const slugify = require('slugify');
import { check } from 'express-validator';
import validatorMiddleware from '../validatorMiddleware.js';
import Category from '../../models/categoryModel.js';

export const getSubcategoryValidator = [
  check('id').isMongoId().withMessage('Invalid subcategory id format'),

  validatorMiddleware,
];

export const createSubcategoryValidator = [
  check('name')
    .notEmpty()
    .withMessage('Subcategory name is required')
    .bail()
    .isLength({ min: 2 })
    .withMessage('Too short subcategory name')
    .isLength({ max: 32 })
    .withMessage('Too long subcategory name'),
  // .custom((name, { req }) => {
  //   req.body.slug = slugify(name); // setting the slug
  //   return true;
  // })
  check('category')
    .notEmpty()
    .withMessage('Subcategory must belong to parent category')
    .bail()
    .isMongoId()
    .withMessage('Invalid subcategory id format')
    .custom(async (categoryId) => {
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new Error('No category found with this id');
      }
    }),
  validatorMiddleware,
];

export const updateSubcategoryValidator = [
  check('id').isMongoId().withMessage('Invalid subcategory id format'),
  check('name')
    .optional()
    .isLength({ min: 3 })
    .withMessage('Too short subcategory name')
    .isLength({ max: 32 })
    .withMessage('Too long subcategory name'),
  // .custom((name, { req }) => {
  //   req.body.slug = slugify(name); // setting the slug
  //   console.log(req.body);
  //   return true;
  // })
  check('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid subcategory id format')
    .custom(async (categoryId) => {
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new Error('No category found with this id');
      }
    }),
  validatorMiddleware,
];

export const deleteSubcategoryValidator = [
  check('id').isMongoId().withMessage('Invalid subcategory id format'),
  validatorMiddleware,
];

export const getSubcategoryProductsValidator = [
  check('subcategoryId').isMongoId().withMessage('Invalid subcategory id format'),

  validatorMiddleware,
];
