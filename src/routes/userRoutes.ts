import express from 'express';

import {
  getUserValidator,
  createUserValidator,
  updateUserValidator,
  deleteUserValidator,
} from '../middlewares/validators/userValidator.js';

import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getMe,
  updateMe,
  deleteMe,
} from '../controllers/userController.js';

import * as authController from '../controllers/authController.js';

const router = express.Router();

router.use(authController.protect);

router.route('/me').get(getMe, getUser).patch(updateUserValidator, updateMe).delete(deleteMe);

router.use(authController.restrictTo('admin', 'manager'));

router.route('/').get(getUsers).post(createUserValidator, createUser);
router
  .route('/:id')
  .get(getUserValidator, getUser)
  .patch(updateUserValidator, updateUser)
  .delete(deleteUserValidator, deleteUser);

export default router;
