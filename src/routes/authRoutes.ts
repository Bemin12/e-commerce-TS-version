import express from 'express';

import {
  signupValidator,
  loginValidator,
  updatePasswordValidator,
  resetPasswordValidator,
  forgotPasswordValidator,
} from '../middlewares/validators/authValidator.js';

import {
  signup,
  verifyEmail,
  login,
  protect,
  updatePassword,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  refreshToken,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signupValidator, signup);
router.patch('/verifyEmail', verifyEmail);
router.post('/login', loginValidator, login);
router.patch('/updateMyPassword', protect, updatePasswordValidator, updatePassword);
router.post('/forgotPassword', forgotPasswordValidator, forgotPassword);
router.post('/verifyResetCode', verifyResetCode);
router.patch('/resetPassword/:resetCode', resetPasswordValidator, resetPassword);
router.post('/refreshToken', refreshToken);

export default router;
