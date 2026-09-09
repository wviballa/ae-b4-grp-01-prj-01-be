import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository.js';
import { profileRepository } from '../repositories/profile.repository.js';
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

    const refreshToken = jwt.sign(payload, ENV.JWT_REFRESH_SECRET, {
      expiresIn: ENV.JWT_REFRESH_EXPIRES_IN,
    });

    return { accessToken, refreshToken };
  },

  async register({ email, password, firstName, lastName, fullName, phone, role = 'CUSTOMER' }) {
    let resolvedFirstName = firstName;
    let resolvedLastName = lastName;

    if (!resolvedFirstName && fullName && typeof fullName === 'string') {
      const parts = fullName.trim().split(/\s+/);
      resolvedFirstName = parts[0] || '';
      resolvedLastName = parts.slice(1).join(' ') || '';
    }

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw ApiError.conflict('An account with this email address already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await userRepository.create({
      email,
      passwordHash,
      role,
    });

    const profile = await profileRepository.createOrUpdate(newUser.userId, {
      firstName: resolvedFirstName,
      lastName: resolvedLastName,
      phone,
    });

    const tokens = this.generateTokens(newUser);

    return {
      user: {
        userId: newUser.userId,
        email: newUser.email,
        role: newUser.role,
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
        profile,
      },
      ...tokens,
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
};
