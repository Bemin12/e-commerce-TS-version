import { Request, Response, NextFunction } from 'express-serve-static-core';

import asyncHandler from '../utils/asyncHandler.js';
import * as factory from './handlerFactory.js';
import filterObj from '../utils/filterObj.js';
import User from '../models/userModel.js';
import APIError from '../utils/apiError.js';

// @desc    Get current user
// @route   GET api/v1/users/me
// @access  Private[Protect]
export const getMe = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  req.params.id = req.user!._id.toString();
  next();
});

// @desc    Update current user
// @route   PATCH api/v1/users/me
// @access  Private[Protect]
export const updateMe = asyncHandler(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new APIError('This route is not for password updates. Please use /updateMyPassword', 400),
    );
  }

  const filteredBody = filterObj(req.body, 'name', 'phone');

  const user = await User.findByIdAndUpdate(req.user!._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ status: 'success', data: { user } });
});

// @desc    De-activate current user
// @route   DELETE api/v1/users/me
// @access  Private[Protect]
export const deleteMe = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user!._id, { active: false });

  res.status(204).send();
});

// @desc    Create user
// @route   POST api/v1/users
// @access  Private[Admin]
export const createUser = factory.createOne(User);

// @desc    Get list of users
// @route   GET api/v1/users
// @access  Private[Admin]
export const getUsers = factory.getAll(User);

// @desc    Get specific user
// @route   GET api/v1/users/:id
// @access  Private[Admin]
export const getUser = factory.getOne(User);

// @desc    Update specific user
// @route   PATCH api/v1/users/:id
// @access  Private[Admin]
export const updateUser = asyncHandler(async (req, res, next) => {
  const filteredBody = filterObj(req.body, 'name', 'phone', 'email', 'role', 'profileImg');

  const user = await User.findByIdAndUpdate(req.params.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ status: 'success', data: { user } });
});

// @desc    Delete specific user
// @route   DELETE api/v1/users/:id
// @access  Private[Admin]
export const deleteUser = factory.deleteOne(User);
