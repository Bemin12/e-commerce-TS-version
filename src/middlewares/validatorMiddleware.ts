import { validationResult, FieldValidationError } from 'express-validator';
import { Request, Response, NextFunction } from 'express-serve-static-core';

// @desc Finds the validation errors in this request and wraps them in an object with handy functions
export default (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      status: 'failed',
      errors: errors
        .array()
        .map((error) => ({ field: (error as FieldValidationError).path, message: error.msg })),
    });
    return;
  }

  next();
};
