import crypto from 'crypto';

import { NextFunction, Request, Response } from 'express-serve-static-core';
import { Model, Types } from 'mongoose';
import jwt, { JwtPayload } from 'jsonwebtoken';

import asyncHandler from '../utils/asyncHandler.js';
import User, { IUser } from '../models/userModel.js';
import RefreshToken from '../models/refreshTokenModel.js';
import APIError from '../utils/apiError.js';
import Email from '../utils/email.js';
import createSendTokens from '../utils/createSendTokens.js';

// @desc    Sign up a new user
// @route   POST /api/v1/auth/signup
// @access  Public
export const signup = asyncHandler(
  async (
    req: Request<{}, {}, Pick<IUser, 'name' | 'email' | 'password' | 'phone'>>,
    res: Response,
    next: NextFunction,
  ) => {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // Send a generic success message after 2 to 2.7 seconds instead of just sending an error if user already exists for security reasons.
      setTimeout(
        () =>
          res.status(201).json({
            status: 'success',
            message: `To continue, enter the code sent to ${email}`,
          }),
        Math.floor(Math.random() * 701) + 2000,
      );

      return;
    }

    const user = new User({ name, email, password, phone });
    const verificationCode = user.createVerificationCode();
    await user.save();

    try {
      await new Email(user, verificationCode).sendVerifyEmail();
    } catch (err) {
      await user.deleteOne();
      return next(new APIError('There was an error sending the email. Please try again', 500));
    }

    res
      .status(201)
      .json({ status: 'success', message: `To continue, enter the code sent to ${email}` });
  },
);

// @desc    Verify user email
// @route   PATCH /api/v1/auth/verifyEmail
// @access  Public
export const verifyEmail = asyncHandler(
  async (
    req: Request<{}, {}, Pick<Partial<IUser>, 'email' | 'verificationCode'>>,
    res: Response,
    next: NextFunction,
  ) => {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return next(new APIError('Please provide email and verification code', 400));
    }

    const hashedVerificationCode = crypto
      .createHash('sha256')
      .update(verificationCode)
      .digest('hex');
    const user = await User.findOneAndUpdate(
      {
        email,
        verificationCode: hashedVerificationCode,
        verificationCodeExpires: { $gt: Date.now() },
      },
      { $set: { verified: true }, $unset: { verificationCode: '', verificationCodeExpires: '' } },
      {
        new: true,
      },
    ).select('-addresses -wishlist');

    if (!user) {
      return next(new APIError('Invalid or expired verification code', 400));
    }

    createSendTokens(200, user, req, res);
  },
);

// @desc    Login
// @route   POST /api/v1/auth/login
// @access  Public
export const login = asyncHandler(
  async (
    req: Request<{}, {}, Pick<IUser, 'email' | 'password'>>,
    res: Response,
    next: NextFunction,
  ) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password -addresses -wishlist');

    if (!user || !(await user.correctPassword(password))) {
      return next(new APIError('Incorrect email or password', 400));
    }

    if (!user.verified) {
      return next(new APIError('Please verify your email before logging in', 401));
    }

    createSendTokens(200, user, req, res);
  },
);

interface MyJwtPayload extends JwtPayload {
  id: string;
}

interface MyJwtPayload extends JwtPayload {
  id: string;
  _id: string;
}

// @desc    Authenticate users
export const protect = asyncHandler(async (req, _res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new APIError('You are not logged in! Please log in to get access', 401));
  }

  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) as MyJwtPayload;

  const currentUser = await User.findById(decoded.id).select('-addresses');
  if (!currentUser) {
    return next(new APIError('The user belonging to this token does no longer exist', 401));
  }

  if (currentUser.changedPasswordAfter(decoded.iat!)) {
    return next(new APIError('User recently changed password! Please log in again', 401));
  }

  if (!currentUser.verified) {
    return next(new APIError('Please verify your email', 401));
  }

  req.user = currentUser;
  next();
});

type Roles = 'user' | 'admin' | 'manager';

// @desc    Authorization | Check user permissions
export const restrictTo =
  (...roles: Roles[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user!.role)) {
      return next(new APIError('You do not have permission to access this route', 403));
    }

    next();
  };

interface UserOwnedDocument {
  [key: string]: any;
  user: { _id: Types.ObjectId };
}
export const restrictToOwner = (Model: Model<any>) =>
  asyncHandler(async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    let query = Model.findById(req.params.id, {}, { skipPopulation: true });
    // query.skipPopulation = true; // defined property to skip user population in reviewModel

    const doc: UserOwnedDocument | null = await query;
    if (!doc) {
      return next(new APIError(`No ${Model.modelName.toLowerCase()} found with this id`, 404));
    }

    const resourceOwner = doc.user;
    if (
      !req.user!._id.equals(resourceOwner._id) &&
      req.user!.role !== 'admin' &&
      req.user!.role !== 'manager'
    ) {
      return next(new APIError('You do not have the permission to perform this action', 403));
    }

    next();
  });

// @desc    Refresh access token and rotate refresh token
// @route   POST /api/v1/auth/refreshToken
// @access  Public - needs a valid refresh token
export const refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return next(new APIError('Refresh token required', 401));
  }

  const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const existingToken = await RefreshToken.findOneAndDelete({ token: hashedToken });
  if (!existingToken) {
    return next(new APIError('Invalid or expired token', 401));
  }

  const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET) as MyJwtPayload;

  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new APIError('The user belonging to this token does no longer exist', 401));
  }

  if (user.changedPasswordAfter(decoded.iat!)) {
    return next(new APIError('User recently changed password! Please log in again', 401));
  }

  createSendTokens(200, user, req, res);
});

// @desc    Update current user password
// @route   PATCH /api/v1/auth/updateMyPassword
// @access  Protected
export const updatePassword = asyncHandler(
  async (
    req: Request<{}, {}, { passwordCurrent: string; password: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    const { passwordCurrent, password } = req.body;

    const user = await User.findById(req.user!._id).select('+password');
    if (!(await user!.correctPassword(passwordCurrent))) {
      return next(new APIError('Password is incorrect', 401));
    }

    user!.password = password;
    await user!.save();

    await RefreshToken.deleteMany({ user: user!._id });
    createSendTokens(201, user!, req, res);
  },
);

// @desc    Send password reset token to email
// @route   POST /api/v1/auth/forgotPassword
// @access  Public
export const forgotPassword = asyncHandler(
  async (req: Request<{}, {}, Pick<IUser, 'email'>>, res: Response, next: NextFunction) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      setTimeout(
        () => {
          res.status(200).json({
            status: 'success',
            message: 'If an account with that email exists, a password reset link has been sent.',
          });
        },
        Math.floor(Math.random() * 701) + 2000,
      );
      return;
    }

    // const token = user.createPasswordResetToken();
    const resetCode = user.createPasswordResetCode();
    await user.save();

    // for existence of frontend we can replace a url to the website
    // const url = `${req.protocol}://${req.get('host')}/api/v1/auth/resetPassword/${token}`;

    try {
      await new Email(user, resetCode).sendPasswordReset();
    } catch (err) {
      user.passwordResetCode = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      return next(new APIError('There was an error sending the email. Please try again', 500));
    }

    res.status(200).json({
      status: 'success',
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  },
);

// @desc    Verify reset password code
// @route   POST /api/v1/auth/verifyResetCode/
// @access  Public
export const verifyResetCode = asyncHandler(async (req, res, next) => {
  const { email, resetCode } = req.body;

  if (!email || !resetCode) {
    return next(new APIError('Please provide email and verification code', 400));
  }

  const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');
  const user = await User.findOne({
    email,
    passwordResetCode: hashedCode,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    // return next(new APIError('Invalid or expired token. Pleas log in again', 400));
    return next(new APIError('Invalid or expired reset code.', 400));
  }

  res.status(200).json({ status: 'success' });
});

// @desc    Reset password using token
// @route   PATCH /api/v1/auth/resetPassword/:token
// @access  Public
export const resetPassword = asyncHandler(
  async (
    req: Request<{ resetCode: string }, {}, Pick<IUser, 'email' | 'password'>>,
    res: Response,
    next: NextFunction,
  ) => {
    const { email, password } = req.body;

    const hashedCode = crypto.createHash('sha256').update(req.params.resetCode).digest('hex');
    const user = await User.findOne({
      email,
      passwordResetCode: hashedCode,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new APIError('Invalid or expired token. Pleas log in again', 400));
    }

    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.password = password;
    await user.save();

    await RefreshToken.deleteMany({ user: user._id });

    createSendTokens(200, user, req, res);
  },
);
