import { authService } from '../services/auth.service.js';
import { addressRepository } from '../repositories/address.repository.js';
import { successResponse, createdResponse } from '../utils/apiResponse.js';

export const authController = {
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, phone } = req.body;
      const result = await authService.register({
        email,
        password,
        firstName,
        lastName,
        phone,
      });
      return createdResponse(res, result);
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      return successResponse(res, result);
    } catch (err) {
      next(err);
    }
  },

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshToken(refreshToken);
      return successResponse(res, tokens);
    } catch (err) {
      next(err);
    }
  },

  async logout(req, res, next) {
    try {
      return successResponse(res, { message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  },

  async getProfile(req, res, next) {
    try {
      const profile = await authService.getProfile(req.user.userId);
      return successResponse(res, profile);
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const updated = await authService.updateProfile(req.user.userId, req.body);
      return successResponse(res, updated);
    } catch (err) {
      next(err);
    }
  },

  // Address sub-controllers for user
  async getAddresses(req, res, next) {
    try {
      const addresses = await addressRepository.findByUserId(req.user.userId);
      return successResponse(res, addresses);
    } catch (err) {
      next(err);
    }
  },

  async createAddress(req, res, next) {
    try {
      const address = await addressRepository.create(req.user.userId, req.body);
      return createdResponse(res, address);
    } catch (err) {
      next(err);
    }
  },

  async updateAddress(req, res, next) {
    try {
      const updated = await addressRepository.update(req.params.addressId, req.user.userId, req.body);
      return successResponse(res, updated);
    } catch (err) {
      next(err);
    }
  },

  async setDefaultAddress(req, res, next) {
    try {
      const updated = await addressRepository.setDefault(req.params.addressId, req.user.userId);
      return successResponse(res, updated);
    } catch (err) {
      next(err);
    }
  },

  async deleteAddress(req, res, next) {
    try {
      await addressRepository.delete(req.params.addressId, req.user.userId);
      return successResponse(res, { message: 'Address deleted successfully' });
    } catch (err) {
      next(err);
    }
  },
};
