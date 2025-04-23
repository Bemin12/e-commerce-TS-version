import path from 'path';
import * as url from 'url';

import sharp from 'sharp';

import Brand from '../models/brandModel.js';
import * as factory from './handlerFactory.js';
import asyncHandler from '../utils/asyncHandler.js';
import { uploadSingleImage } from '../middlewares/uploadImageMiddleware.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export const uploadBrandImage = uploadSingleImage('image');

export const resizeImage = asyncHandler(async (req, _res, next) => {
  if (!req.file) return next();

  const filename = `brand-${Math.round(Math.random() * 1e9)}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(path.join(__dirname, '..', 'uploads', 'brands', filename));

  req.body.image = `/brands/${filename}`;

  next();
});

// @desc    Get list of brands
// @route   GET /api/v1/brands
// @access  Public
export const getBrands = factory.getAll(Brand);

// @desc    Get specific brand by id
// @route   GET /api/v1/brands/:id
// @access  Public
export const getBrand = factory.getOne(Brand);

// @desc    Create brand
// @route   POST /api/v1/brands
// @access  Protected: Admin, Manager
export const createBrand = factory.createOne(Brand);

// @desc    Update specific brand
// @route   PATCH /api/v1/brands/:id
// @access  Protected: Admin, Manager
export const updateBrand = factory.updateOne(Brand);

// @desc    Delete specific brand
// @route   DELETE /api/v1/brands/:id
// @access  Protected: Admin
export const deleteBrand = factory.deleteOne(Brand);
