import { NextFunction, Request, Response } from 'express';
import APIError from '../utils/apiError.js';

const handleCastErrorDB = (err: any) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new APIError(message, 400);
};

const handlerValidationErrorDB = (error: any) => {
  // const message = Object.keys(error.errors)
  //   .map((key) => `${key}: ${error.errors[key].message}`)
  //   .join(' | ');

  const message = Object.values(error.errors)
    .map((el: any) => el.message)
    .join('. ');

  return new APIError(message, 400);
};

const handlerDuplicateFieldErrorDB = (error: any) => {
  const message = `Duplicate field value: ${Object.keys(error.keyValue).join(
    ', ',
  )}. Please use another value`;

  return new APIError(message, 400);
};

const handleJWTExipres = () =>
  new APIError('Your token has expired. Please log in again or refresh the token', 401);

const handleJWTError = () => new APIError('Invalid token. Please login again', 401);

const sendErrorDev = (err: any, res: Response) =>
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });

const sendErrorProd = (err: any, res: Response) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({ status: err.status, message: err.message });
  }

  res.status(500).json({ status: 'error', message: 'Something went wrong!' });
};

export default (err: any, req: Request, res: Response, next: NextFunction) => {
  err.status = err.status || 'error';
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.assign(Object.create(Object.getPrototypeOf(err)), err);
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handlerDuplicateFieldErrorDB(error);
    if (error.name === 'ValidationError') error = handlerValidationErrorDB(error);
    if (error.name === 'TokenExpiredError') error = handleJWTExipres();
    if (error.name === 'JsonWebTokenError') error = handleJWTError();

    sendErrorProd(error, res);
  }
};
