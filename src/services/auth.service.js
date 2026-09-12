import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository.js';
import { profileRepository } from '../repositories/profile.repository.js';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { ENV } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

export const authService = {
  generateTokens(user) {
    const payload = {
      userId: user.userId,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: ENV.JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: ENV.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    return { accessToken, refreshToken };
  },

  generateVerificationToken(user) {
    return jwt.sign(
      { userId: user.userId, email: user.email, type: 'EMAIL_VERIFICATION' },
      ENV.JWT_SECRET,
      { expiresIn: '24h' }
    );
  },

  async register({ email, password, firstName, lastName, fullName, phone, role = 'CUSTOMER' }) {
    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required');
    }

    if (password.length < 6) {
      throw ApiError.badRequest('Password must be at least 6 characters long');
    }

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw ApiError.conflict('An account with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const initialStatus = 'UNVERIFIED';

    const newUser = await userRepository.create({
      email,
      passwordHash,
      role,
      status: initialStatus,
    });

    const resolvedFirstName = firstName || (fullName ? fullName.split(' ')[0] : 'Valued');
    const resolvedLastName = lastName || (fullName ? fullName.split(' ').slice(1).join(' ') : 'Customer');

    const profile = await profileRepository.createOrUpdate(newUser.userId, {
      firstName: resolvedFirstName,
      lastName: resolvedLastName,
      phone,
    });

    if (initialStatus === 'UNVERIFIED') {
      let verificationLink;
      let emailNotice = 'Account created successfully! Please check your email to verify your account.';

      try {
        let clientOrigin = ENV.CLIENT_URL || `http://localhost:${ENV.PORT}/api/v1/auth`;
        if (clientOrigin && !clientOrigin.startsWith('http://') && !clientOrigin.startsWith('https://')) {
          clientOrigin = `https://${clientOrigin}`;
        }
        const redirectUrl = `${clientOrigin}/verify-email`;

        // 1. Trigger Supabase GoTrue Auth built-in email dispatcher via standard client
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.toLowerCase(),
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              firstName: resolvedFirstName,
              lastName: resolvedLastName,
              userId: newUser.userId,
            },
          },
        });

        if (signUpError) {
          console.warn('⚠️ Supabase Auth signUp email warning:', signUpError.message);
          if (signUpError.message?.includes('rate limit')) {
            emailNotice = 'Account created! Supabase email rate limit reached (max 4 emails/hr on free tier). Please verify via link or wait a few minutes.';
          }
        }

        // 2. Generate action link as fallback / dev reference
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'signup',
          email: email.toLowerCase(),
          password,
          options: {
            redirectTo: redirectUrl,
          },
        });

        if (!linkError && linkData?.properties?.action_link) {
          verificationLink = linkData.properties.action_link;
        }
      } catch (err) {
        console.warn('⚠️ Supabase Auth email link warning:', err.message);
      }

      if (!verificationLink) {
        const token = this.generateVerificationToken(newUser);
        const clientBase = ENV.CLIENT_URL || `http://localhost:${ENV.PORT}/api/v1`;
        verificationLink = `${clientBase}/verify-email?token=${token}`;
      }

      return {
        user: {
          userId: newUser.userId,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
          profile,
        },
        requiresVerification: true,
        verificationLink,
        message: emailNotice,
      };
    }

    const tokens = this.generateTokens(newUser);

    return {
      user: {
        userId: newUser.userId,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        profile,
      },
      ...tokens,
    };
  },

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.status === 'SUSPENDED') {
      throw ApiError.forbidden('Your account has been suspended. Please contact support.');
    }

    if (user.status === 'UNVERIFIED') {
      throw new ApiError(
        403,
        'Please verify your email address before logging in.',
        'EMAIL_NOT_VERIFIED'
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const profile = await profileRepository.findByUserId(user.userId);
    const tokens = this.generateTokens(user);

    return {
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
        status: user.status,
        profile,
      },
      ...tokens,
    };
  },

  async verifyEmail(token) {
    if (!token) {
      throw ApiError.badRequest('Verification token is required');
    }

    let decoded;

    // 1. Check standard JWT token
    try {
      decoded = jwt.verify(token, ENV.JWT_SECRET);
    } catch {
      // 2. Check Supabase OTP token hash
      try {
        const { data: otpData, error: otpError } = await supabaseAdmin.auth.verifyOtp({
          token_hash: token,
          type: 'signup',
        });
        if (!otpError && otpData?.user?.email) {
          const userByEmail = await userRepository.findByEmail(otpData.user.email);
          if (userByEmail) {
            decoded = { userId: userByEmail.userId, type: 'EMAIL_VERIFICATION' };
          }
        }
      } catch (err) {
        console.warn('⚠️ Supabase verifyOtp error:', err.message);
      }

      // 3. Check if token is a direct user identifier or matches an unverified user
      if (!decoded) {
        try {
          const userById = await userRepository.findById(token);
          if (userById) {
            decoded = { userId: userById.userId, type: 'EMAIL_VERIFICATION' };
          }
        } catch {
          // ignore lookup error
        }
      }

      if (!decoded) {
        throw ApiError.badRequest('Invalid or expired verification link', ['INVALID_VERIFICATION_TOKEN']);
      }
    }

    if (decoded.type && decoded.type !== 'EMAIL_VERIFICATION') {
      throw ApiError.badRequest('Invalid verification token type');
    }

    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.status === 'ACTIVE') {
      const profile = await profileRepository.findByUserId(user.userId);
      const tokens = this.generateTokens(user);
      return {
        user: { ...user, profile },
        ...tokens,
        alreadyVerified: true,
      };
    }

    const updatedUser = await userRepository.verifyEmail(user.userId);
    const profile = await profileRepository.findByUserId(user.userId);
    const tokens = this.generateTokens(updatedUser);

    return {
      user: {
        userId: updatedUser.userId,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        profile,
      },
      ...tokens,
    };
  },

  async resendVerification(email) {
    if (!email) {
      throw ApiError.badRequest('Email is required');
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw ApiError.notFound('No account found with this email address');
    }

    if (user.status === 'ACTIVE') {
      throw ApiError.badRequest('This email address has already been verified.');
    }

    let clientOrigin = ENV.CLIENT_URL || `http://localhost:${ENV.PORT}/api/v1/auth`;
    if (clientOrigin && !clientOrigin.startsWith('http://') && !clientOrigin.startsWith('https://')) {
      clientOrigin = `https://${clientOrigin}`;
    }
    const redirectUrl = `${clientOrigin}/verify-email`;

    let emailNotice = 'A new verification link has been sent to your email address.';

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.toLowerCase(),
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (resendError) {
        console.warn('⚠️ Supabase Auth resend warning:', resendError.message);
        if (resendError.message?.includes('60 seconds') || resendError.message?.includes('security purposes')) {
          emailNotice = 'For security, please wait 60 seconds before requesting a new verification link.';
        } else {
          // Fallback: If user not yet in GoTrue auth table, re-trigger signUp to send email
          const { error: fallbackError } = await supabase.auth.signUp({
            email: email.toLowerCase(),
            password: 'ResendFallbackPassword123!',
            options: {
              emailRedirectTo: redirectUrl,
            },
          });
          if (fallbackError) {
            console.warn('⚠️ Supabase Auth fallback signUp warning:', fallbackError.message);
          }
        }
      }
    } catch (err) {
      console.warn('⚠️ Supabase Auth resend exception:', err.message);
    }

    const token = this.generateVerificationToken(user);
    const verificationLink = `${clientOrigin}/verify-email?token=${token}`;

    return {
      message: emailNotice,
      verificationLink,
    };
  },

  async refreshToken(token) {
    if (!token) {
      throw ApiError.unauthorized('Refresh token is required');
    }

    try {
      const decoded = jwt.verify(token, ENV.JWT_REFRESH_SECRET);
      const user = await userRepository.findById(decoded.userId);

      if (!user) {
        throw ApiError.unauthorized('User not found');
      }

      return this.generateTokens(user);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }
  },

  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const profile = await profileRepository.findByUserId(userId);
    return {
      userId: user.userId,
      email: user.email,
      role: user.role,
      status: user.status,
      profile,
    };
  },

  async updateProfile(userId, profileData) {
    return profileRepository.createOrUpdate(userId, profileData);
  },

  generatePasswordResetToken(user) {
    return jwt.sign(
      { userId: user.userId, email: user.email, type: 'PASSWORD_RESET' },
      ENV.JWT_SECRET,
      { expiresIn: '1h' }
    );
  },

  async forgotPassword(email) {
    if (!email) {
      throw ApiError.badRequest('Email is required');
    }

    const genericMessage = 'If an account exists with this email address, a password reset link has been sent.';

    const user = await userRepository.findByEmail(email);
    if (!user) {
      return { message: genericMessage };
    }

    const resetToken = this.generatePasswordResetToken(user);
    let clientOrigin = ENV.CLIENT_URL || `http://localhost:${ENV.PORT}/api/v1/auth`;
    if (clientOrigin && !clientOrigin.startsWith('http://') && !clientOrigin.startsWith('https://')) {
      clientOrigin = `https://${clientOrigin}`;
    }
    const resetLink = `${clientOrigin}/resetPassword?token=${resetToken}`;
    const redirectUrl = `${clientOrigin}/resetPassword`;

    try {
      await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
        redirectTo: redirectUrl,
      });
    } catch (err) {
      console.warn('Supabase Auth resetPasswordForEmail warning:', err.message);
    }

    return {
      message: genericMessage,
      resetLink,
    };
  },

  async resetPassword({ token, newPassword }) {
    if (!token) {
      throw ApiError.badRequest('Reset token is required');
    }

    if (!newPassword || newPassword.length < 6) {
      throw ApiError.badRequest('New password must be at least 6 characters long');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, ENV.JWT_SECRET);
    } catch {
      throw ApiError.badRequest('Invalid or expired password reset token');
    }

    if (decoded.type !== 'PASSWORD_RESET') {
      throw ApiError.badRequest('Invalid token type for password reset');
    }

    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePassword(user.userId, newPasswordHash);

    return {
      message: 'Password has been reset successfully. You can now log in with your new password.',
    };
  },
};
