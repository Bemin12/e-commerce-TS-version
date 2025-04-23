import express from 'express';
import {
  getSubcategoryValidator,
  createSubcategoryValidator,
  updateSubcategoryValidator,
  deleteSubcategoryValidator,
  getSubcategoryProductsValidator,
} from '../middlewares/validators/subcategoryValidator.js';

import {
  getSubcategories,
  getSubcategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  setCategoryIdToBody,
  createFilterObj,
} from '../controllers/subcategoryController.js';

import * as authController from '../controllers/authController.js';
import productRouter from './productRoutes.js';

const router = express.Router({ mergeParams: true });

router.use('/:subcategoryId/products', getSubcategoryProductsValidator, productRouter);

router
  .route('/')
  .get(createFilterObj, getSubcategories)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'manager'),
    setCategoryIdToBody,
    createSubcategoryValidator,
    createSubcategory,
  );

router
  .route('/:id')
  .get(getSubcategoryValidator, getSubcategory)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'manager'),
    updateSubcategoryValidator,
    updateSubcategory,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    deleteSubcategoryValidator,
    deleteSubcategory,
  );

export default router;
