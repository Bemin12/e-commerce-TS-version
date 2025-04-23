/* eslint-disable */
import validatorMiddleware from '../middlewares/validatorMiddleware.js';
import { createProductValidator } from '../middlewares/validators/productValidator.js';
import Category from '../models/categoryModel.js';
import Subcategory from '../models/subcategoryModel.js';

jest.mock('../models/categoryModel');
jest.mock('../models/subcategoryModel');

describe('product validator', () => {
  describe('createProductValidator', () => {
    let req: any;
    let res: any;
    let next: any;
    beforeEach(() => {
      (Category.findById as jest.Mock).mockResolvedValue({
        _id: '67c82c1802303f379982ebd0',
        name: 'categoryName',
      });
      req = {
        body: {
          name: 'Iphone 16',
          description: 'Valid description text that is long enough',
          quantity: 5,
          price: 50000,
          category: '67c82c1802303f379982ebd0',
        },
        files: {
          imageCover: [
            {
              originalname: 'cover.jpg',
            },
          ],
          images: [
            {
              originalname: 'image1.jpg',
            },
            {
              originalname: 'image2.jpg',
            },
          ],
        },
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      next = jest.fn();
    });

    // Reusable function for test cases
    const runValidators = async (
      statusCode: number,
      status: string,
      field: string,
      message: string,
    ) => {
      await Promise.all(createProductValidator.map((validator) => validator(req, res, next)));
      validatorMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(statusCode);

      const responseBody = res.json.mock.calls[0][0];
      expect(responseBody.status).toBe(status);
      expect(responseBody.errors).toEqual([{ field, message }]);
    };

    it('should pass validation for valid input', async () => {
      await Promise.all(createProductValidator.map((validator) => validator(req, res, next)));
      validatorMiddleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(createProductValidator.length + 1);
    });

    describe('name', () => {
      it('should fail if name is missing', async () => {
        delete req.body.name;
        runValidators(400, 'failed', 'name', 'Product name is required');
      });

      it('should fail for short name', async () => {
        req.body.name = 'dd';
        runValidators(400, 'failed', 'name', 'Too short product name');
      });

      it('should fail for long name', async () => {
        req.body.name = 'b'.repeat(101);
        runValidators(400, 'failed', 'name', 'Too long product name');
      });
    });

    describe('description', () => {
      it('should fail for missing description ', async () => {
        delete req.body.description;
        runValidators(400, 'failed', 'description', 'Product description is required');
      });

      it('should fail for short description ', async () => {
        req.body.description = 'short description';
        runValidators(400, 'failed', 'description', 'Too short product description');
      });
    });

    describe('quantity', () => {
      it('should fail if quantity is missing', async () => {
        delete req.body.quantity;
        runValidators(400, 'failed', 'quantity', 'Product quantity is required');
      });

      it('should fail for negative quantity ', async () => {
        req.body.quantity = -1;
        runValidators(400, 'failed', 'quantity', 'Product quantity must be a positive integer');
      });
    });

    describe('sold', () => {
      it('should fail for negative sold', async () => {
        req.body.sold = -1;
        runValidators(400, 'failed', 'sold', 'Sold quantity must be a positive number');
      });
    });

    describe('price', () => {
      it('should fail if price is missing', async () => {
        delete req.body.price;
        runValidators(400, 'failed', 'price', 'Product price is required');
      });

      it('should fail for negative price', async () => {
        req.body.price = -50;
        runValidators(400, 'failed', 'price', 'Price must be a positive number');
      });
    });

    describe('priceAfterDiscount', () => {
      it('should fail for invalid "priceAfterDiscount"', async () => {
        req.body.priceAfterDiscount = 60000;
        runValidators(
          400,
          'failed',
          'priceAfterDiscount',
          'Discount price should be below regular price',
        );
      });
    });

    describe('colors', () => {
      it('should fail for invalid "colors" datatype', async () => {
        req.body.colors = 'color';
        runValidators(400, 'failed', 'colors', 'colors should be an array of strings');
      });

      it('should fail for invalid "colors" strings', async () => {
        req.body.colors = [''];
        runValidators(400, 'failed', 'colors', 'colors should be an array of non-empty strings');
      });
    });

    describe('imageCover', () => {
      it('should fail if "imageCover" is missing', async () => {
        delete req.files.imageCover;
        runValidators(400, 'failed', 'imageCover', 'Product imageCover is required');
      });

      it('should fail for invalid "imageCover" format', async () => {
        req.files.imageCover[0].originalname = 'image.mp4';
        runValidators(400, 'failed', 'imageCover', 'Image must be jpg, jpeg, or png format');
      });
    });

    describe('images', () => {
      it('should fail for invalid "images"', async () => {
        req.files.images[0].originalname = ['video.mp4'];
        runValidators(400, 'failed', 'images', 'Images must be jpg, jpeg, or png format');
      });
    });

    describe('category', () => {
      it('should fail if "category" is missing', async () => {
        delete req.body.category;
        runValidators(400, 'failed', 'category', 'Product must belong to category');
      });

      it('should fail for invalid "category" id', async () => {
        req.body.category = 'invalid';
        runValidators(400, 'failed', 'category', 'Invalid category id format');
      });

      it('should fail if "category" does not exist in the database', async () => {
        (Category.findById as jest.Mock).mockResolvedValue(null);
        runValidators(
          400,
          'failed',
          'category',
          'No category found with this id: 67c82c1802303f379982ebd0',
        );
      });
    });

    describe('subcategories', () => {
      it('should fail for invalid "subcategories" datatype', async () => {
        req.body.subcategories = 'sss';
        runValidators(400, 'failed', 'subcategories', 'subcategories must be array of MongoIds');
      });

      it('should fail for invalid "subcategories" Ids', async () => {
        req.body.subcategories = ['invalid'];
        runValidators(400, 'failed', 'subcategories', 'Invalid subcategory id format');
      });

      it('should fail if found "subcategories" length is less than provided Ids', async () => {
        (Subcategory.find as jest.Mock).mockResolvedValue([
          { _id: '67c82de5cc779f38704f8d0f', name: 'sub' },
        ]);
        req.body.subcategories = ['67c82de5cc779f38704f8d0f', '67c84c6f9e7cac3d6dac3160'];
        runValidators(400, 'failed', 'subcategories', 'Invalid subcategories Ids');
      });
    });

    describe('brand', () => {
      it('should fail for invalid "brand" id format', async () => {
        req.body.brand = 'invalid';
        runValidators(400, 'failed', 'brand', 'Invalid brand id format');
      });
    });

    describe('ratingsAverage', () => {
      it('should fail for negative "ratingsAverage"', () => {
        req.body.ratingsAverage = -1;
        runValidators(
          400,
          'failed',
          'ratingsAverage',
          'Rating must be a number above or equal to 1 and below or equal to 5',
        );
      });

      it('should fail if "ratingsAverage" is greater than 5', () => {
        req.body.ratingsAverage = 6;
        runValidators(
          400,
          'failed',
          'ratingsAverage',
          'Rating must be a number above or equal to 1 and below or equal to 5',
        );
      });
    });
  });
});
