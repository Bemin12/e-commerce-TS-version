/* eslint-disable */

import { signupValidator } from '../middlewares/validators/authValidator.js';
import validatorMiddleware from '../middlewares/validatorMiddleware.js';

describe('authValidator', () => {
  describe('signupValidator', () => {
    let req: any;
    let res: any;
    let next: any;
    beforeEach(() => {
      req = {
        body: {
          name: 'test user',
          email: 'test@example.com',
          phone: '01234567890',
          password: 'test1234',
          passwordConfirm: 'test1234',
          profileImg: 'image.jpg',
        },
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      next = jest.fn();
    });

    describe('name', () => {
      it('should fail if name is missing', async () => {
        delete req.body.name;
        await Promise.all(signupValidator.map((validator) => validator(req, res, next)));
        validatorMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          status: 'failed',
          errors: [{ field: 'name', message: 'Please provide a name' }],
        });
      });
    });

    describe('email', () => {
      it('should fail if email is missing', async () => {
        delete req.body.email;
        await Promise.all(signupValidator.map((validator) => validator(req, res, next)));
        validatorMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          status: 'failed',
          errors: [{ field: 'email', message: 'Please provide your email' }],
        });
      });

      it('should fail if email is not valid', async () => {
        req.body.email = 'invalid@gmail';
        await Promise.all(signupValidator.map((validator) => validator(req, res, next)));
        validatorMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          status: 'failed',
          errors: [{ field: 'email', message: 'Please provide a valid email' }],
        });
      });
    });

    describe('phone', () => {
      it('should fail if phone is not valid number', async () => {
        req.body.phone = '1234567891011';
        await Promise.all(signupValidator.map((validator) => validator(req, res, next)));
        validatorMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          status: 'failed',
          errors: [{ field: 'phone', message: 'Please provide a valid phone number' }],
        });
      });
    });

    describe('password and passwordConfirm', () => {
      it('should fail if password is missing', async () => {
        delete req.body.password;
        await Promise.all(signupValidator.map((validator) => validator(req, res, next)));
        validatorMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          status: 'failed',
          errors: [
            { field: 'password', message: 'Please provide a password' },
            { field: 'passwordConfirm', message: 'password and passwordConfirm are not the same' },
          ],
        });
      });

      it('should fail if password length is less than 6 characters', async () => {
        req.body.password = 'test';
        req.body.passwordConfirm = 'test';
        await Promise.all(signupValidator.map((validator) => validator(req, res, next)));
        validatorMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          status: 'failed',
          errors: [{ field: 'password', message: 'Too short password' }],
        });
      });

      it('should fail if passwordConfirm is missing', async () => {
        delete req.body.passwordConfirm;
        await Promise.all(signupValidator.map((validator) => validator(req, res, next)));
        validatorMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          status: 'failed',
          errors: [{ field: 'passwordConfirm', message: 'Please confirm your password' }],
        });
      });

      it('should fail if password and passwordConfirm are not the same', async () => {
        req.body.passwordConfirm = 'not the same';
        await Promise.all(signupValidator.map((validator) => validator(req, res, next)));
        validatorMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          status: 'failed',
          errors: [
            { field: 'passwordConfirm', message: 'password and passwordConfirm are not the same' },
          ],
        });
      });
    });

    it('should fail if profileImg format is not valid', async () => {
      req.body.profileImg = 'image.mp4';
      await Promise.all(signupValidator.map((validator) => validator(req, res, next)));
      validatorMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'failed',
        errors: [
          { field: 'profileImg', message: 'Profile image must be jpg, jpeg, or png format' },
        ],
      });
    });
  });
});
