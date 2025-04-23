import express from 'express';
import {
  addAddressValidator,
  removeAddressValidator,
} from '../middlewares/validators/addressValidator.js';

import {
  addAddress,
  removeAddress,
  getCurrentUserAddresses,
  updateAddress,
} from '../controllers/addressController.js';

import * as authController from '../controllers/authController.js';

const router = express.Router();

router.use(authController.protect, authController.restrictTo('user'));

router.route('/').get(getCurrentUserAddresses).post(addAddressValidator, addAddress);

router.delete('/:addressId', removeAddressValidator, removeAddress);
router.patch('/:addressId', updateAddress);

export default router;
