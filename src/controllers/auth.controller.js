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

      // If browser accepts HTML, render clean confirmation UI with cross-tab sync and auto-close
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
        const userJson = JSON.stringify(result.user || {});
        return res.send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <title>Email Verified - Toy Store</title>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              * { box-sizing: border-box; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                color: #f8fafc;
              }
              .card {
                background: #1e293b;
                border: 1px solid rgba(255, 255, 255, 0.1);
                padding: 2.5rem;
                border-radius: 20px;
                box-shadow: 0 20px 40px -15px rgba(0,0,0,0.5);
                text-align: center;
                max-width: 440px;
                width: 90%;
                animation: fadeIn 0.4s ease-out;
              }
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .icon-wrapper {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 1.25rem auto;
                box-shadow: 0 8px 20px rgba(34, 197, 94, 0.3);
              }
              .icon { font-size: 2.5rem; color: white; }
              h1 { color: #ffffff; font-size: 1.6rem; margin: 0 0 0.5rem 0; font-weight: 700; }
              .badge {
                display: inline-block;
                background: rgba(34, 197, 94, 0.15);
                color: #4ade80;
                border: 1px solid rgba(74, 222, 128, 0.3);
                padding: 0.35rem 0.85rem;
                border-radius: 9999px;
                font-weight: 600;
                font-size: 0.85rem;
                margin-bottom: 1.25rem;
              }
              p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; margin-bottom: 1.5rem; }
              .countdown-text { color: #64748b; font-size: 0.85rem; margin-top: 1rem; }
              .countdown-num { font-weight: 700; color: #38bdf8; }
              .btn {
                display: inline-block;
                width: 100%;
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                color: white;
                font-weight: 600;
                font-size: 0.95rem;
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 12px;
                cursor: pointer;
                transition: transform 0.15s ease, box-shadow 0.15s ease;
                box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
                text-decoration: none;
              }
              .btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="icon-wrapper">
                <div class="icon">✓</div>
              </div>
              <h1>Email Verified Successfully!</h1>
              <div class="badge">Account Active</div>
              <p>Your account is now verified and active. You can now log in with your email and password.</p>
              <a href="${ENV.getPublicBaseUrl()}/login?verified=true" class="btn">Proceed to Login</a>
              <div class="countdown-text">Redirecting to login in <span id="timer" class="countdown-num">3</span>s...</div>
            </div>

            <script>
              (function() {
                const userData = ${userJson};
                const eventPayload = { verified: true, user: userData, timestamp: Date.now() };

                // 1. Cross-tab message via BroadcastChannel
                try {
                  if ('BroadcastChannel' in window) {
                    const bc = new BroadcastChannel('toystore_auth');
                    bc.postMessage(eventPayload);
                  }
                } catch(e) {}

                // 2. Cross-tab message via localStorage fallback
                try {
                  localStorage.setItem('toystore_email_verified', JSON.stringify(eventPayload));
                } catch(e) {}

                // 3. Auto-redirect countdown to /login?verified=true
                let seconds = 3;
                const timerEl = document.getElementById('timer');
                const interval = setInterval(function() {
                  seconds--;
                  if (timerEl) timerEl.innerText = seconds;
                  if (seconds <= 0) {
                    clearInterval(interval);
                    window.location.href = "${ENV.getPublicBaseUrl()}/login?verified=true";
                  }
                }, 1000);
              })();

              function closeOrReturn() {
                window.location.href = "${ENV.getPublicBaseUrl()}/login?verified=true";
              }
            </script>
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

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      return successResponse(res, result);
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const { token, newPassword, password } = req.body;
      const result = await authService.resetPassword({
        token,
        newPassword: newPassword || password,
      });
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
