import { authService } from '../services/auth.service.js';
import { addressRepository } from '../repositories/address.repository.js';
import { successResponse, createdResponse } from '../utils/apiResponse.js';

export const authController = {
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, fullName, name, phone } = req.body;
      const result = await authService.register({
        email,
        password,
        firstName,
        lastName,
        fullName: fullName || name,
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

  async verifyEmail(req, res, next) {
    try {
      const token = req.query.token || req.body.token;
      const result = await authService.verifyEmail(token);

      // If browser accepts HTML, render clean confirmation UI
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Email Verified - Toy Store</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; }
              .card { background: white; padding: 2.5rem; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08); text-align: center; max-width: 420px; width: 90%; }
              .icon { font-size: 3rem; margin-bottom: 1rem; }
              h1 { color: #16a34a; font-size: 1.6rem; margin: 0 0 0.5rem 0; font-weight: 700; }
              p { color: #64748b; font-size: 0.95rem; line-height: 1.5; margin-bottom: 1.5rem; }
              .badge { display: inline-block; background: #dcfce7; color: #15803d; padding: 0.35rem 0.85rem; border-radius: 9999px; font-weight: 600; font-size: 0.85rem; margin-bottom: 1.5rem; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="icon">🎉</div>
              <h1>Email Verified Successfully!</h1>
              <div class="badge">Account Active</div>
              <p>Your account has been activated. You can now return to the Toy Store application and log in.</p>
            </div>
          </body>
          </html>
        `);
      }

      return successResponse(res, result);
    } catch (err) {
      next(err);
    }
  },

  async resendVerification(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.resendVerification(email);
      return successResponse(res, result);
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
