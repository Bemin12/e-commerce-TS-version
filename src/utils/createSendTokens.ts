import { Request, Response } from 'express';
import { Types } from 'mongoose';
import jwt, { SignOptions } from 'jsonwebtoken';
import RefreshToken from '../models/refreshTokenModel.js';
import { IUser } from '../models/userModel.js';

const signTokens = (id: Types.ObjectId) => {
  const accessToken = jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
  } as SignOptions);
  const refreshToken = jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
  } as SignOptions);

  return { accessToken, refreshToken };
};

const createSendTokens = async (statusCode: number, user: IUser, req: Request, res: Response) => {
  const { accessToken, refreshToken } = signTokens(user._id);

  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    expiresAt: new Date(
      Date.now() + process.env.REFRESH_TOKEN_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
  });

  res.cookie('refreshToken', refreshToken, {
    expires: new Date(
      Date.now() + process.env.REFRESH_TOKEN_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    sameSite: 'strict',
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  res.status(statusCode).json({ status: 'success', accessToken, data: { user } });
};

export default createSendTokens;
