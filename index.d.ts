import 'express';
import { IUser } from './src/models/userModel';

// Extending `Request` interface via declaration merging
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      filterObj?: Record<string, any>;
      files?: {
        imageCover?: Express.Multer.File;
        images?: Express.Multer.File[];
      };
    }
  }
}
