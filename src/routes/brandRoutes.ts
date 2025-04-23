import express from 'express';
import {
  getBrandValidator,
  createBrandValidator,
  updateBrandValidator,
  deleteBrandValidator,
} from '../middlewares/validators/brandValidator.js';

import {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
  uploadBrandImage,
  resizeImage,
} from '../controllers/brandController.js';

import * as authController from '../controllers/authController.js';

const router = express.Router();

router
  .route('/')
  .get(getBrands)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'manager'),
    uploadBrandImage,
    createBrandValidator,
    resizeImage,
    createBrand,
  );
router
  .route('/:id')
  .get(getBrandValidator, getBrand)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'manager'),
    uploadBrandImage,
    updateBrandValidator,
    resizeImage,
    updateBrand,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    deleteBrandValidator,
    deleteBrand,
  );

export default router;
