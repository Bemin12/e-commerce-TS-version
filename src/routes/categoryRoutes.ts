import express from 'express';
import {
  getCategoryValidator,
  createCategoryValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
  getCategorySubcategoriesValidator,
} from '../middlewares/validators/categoryValidator.js';

import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
  resizeImage,
} from '../controllers/categoryController.js';

import subcategoryRouter from './subcategoryRoutes.js';
import productRouter from './productRoutes.js';

import * as authController from '../controllers/authController.js';

const router = express.Router();

router.use('/:categoryId/subcategories', getCategorySubcategoriesValidator, subcategoryRouter);
// router.use('/:categoryId/subcategories/:subcategoryId/products', productRouter);
router.use('/:categoryId/products', getCategorySubcategoriesValidator, productRouter);

router
  .route('/')
  .get(getCategories)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'manager'),
    uploadCategoryImage,
    createCategoryValidator,
    resizeImage,
    createCategory,
  );
router
  .route('/:id')
  .get(getCategoryValidator, getCategory)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'manager'),
    uploadCategoryImage,
    updateCategoryValidator,
    resizeImage,
    updateCategory,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    deleteCategoryValidator,
    deleteCategory,
  );

export default router;
