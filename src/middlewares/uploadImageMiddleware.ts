import multer, { FileFilterCallback } from 'multer';
import APIError from '../utils/apiError.js';
import { Request } from 'express';

const multerStorage = multer.memoryStorage();

const multerFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new APIError('Uploaded file is not an image', 400));
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

export const uploadSingleImage = (fieldName: string) => upload.single(fieldName);

export const uploadMixOfImages = (arrayOfFields: { name: string; maxCount: number }[]) =>
  upload.fields(arrayOfFields);
