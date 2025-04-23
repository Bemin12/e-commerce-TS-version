import path from 'path';
import * as url from 'url';

import sharp from 'sharp';

import Category from '../models/categoryModel.js';
import * as factory from './handlerFactory.js';
import asyncHandler from '../utils/asyncHandler.js';
import { uploadSingleImage } from '../middlewares/uploadImageMiddleware.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export const uploadCategoryImage = uploadSingleImage('image');

export const resizeImage = asyncHandler(async (req, _res, next) => {
  if (!req.file) return next();

  const filename = `category-${Math.round(Math.random() * 1e9)}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(path.join(__dirname, '..', 'uploads', 'categories', filename));

  req.body.image = `/categories/${filename}`;

  next();
});

// @desc    Get list of categories
// @route   GET /api/v1/categories
// @access  Public
export const getCategories = factory.getAll(Category);

// @desc    Get specific category by id
// @route   GET /api/v1/categories/:id
// @access  Public
export const getCategory = factory.getOne(Category);

// @desc    Create category
// @route   POST /api/v1/categories
// @access  Protected: Admin, Manager
export const createCategory = factory.createOne(Category);

// @desc    Update specific category
// @route   PATCH /api/v1/categories/:id
// @access  Protected: Admin, Manager
export const updateCategory = factory.updateOne(Category);

// @desc    Delete specific category
// @route   DELETE /api/v1/categories/:id
// @access  Protected: Admin
export const deleteCategory = factory.deleteOne(Category);
