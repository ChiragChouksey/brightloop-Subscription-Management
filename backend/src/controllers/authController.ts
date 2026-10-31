import { Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/prisma.js';
import { generateToken } from '../config/jwt.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { validatePassword, validateEmail } from '../utils/validation.js';

export const register = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, companyName } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email and password are required.' });
      return;
    }

    if (!validateEmail(email)) {
      res.status(400).json({ success: false, message: 'Invalid email format.' });
      return;
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      res.status(400).json({ success: false, message: passwordCheck.reason });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: 'CUSTOMER',
        phone,
        companyName,
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as any,
      name: user.name,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        phone: user.phone,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error registering user.' });
  }
};

export const login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as any,
      name: user.name,
    });

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        phone: user.phone,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error logging in.' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyName: true,
        phone: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const forgotPassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      // Security standard: don't reveal if email exists, return success message
      res.json({
        success: true,
        message: 'If the email is registered, a password reset link has been dispatched.',
      });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiresAt = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetExpiresAt },
    });

    // In local hackathon environment, return the reset token for effortless direct testing
    res.json({
      success: true,
      message: `Reset link dispatched to registered email: ${email}`,
      resetToken, // for testing convenience
      resetLink: `http://localhost:5173/reset-password?token=${resetToken}`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ success: false, message: 'Token and new password are required.' });
      return;
    }

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      res.status(400).json({ success: false, message: passwordCheck.reason });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      res.status(400).json({ success: false, message: 'Reset token is invalid or has expired.' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetExpiresAt: null,
      },
    });

    res.json({ success: true, message: 'Password has been successfully updated. You can now log in.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ONLY ADMIN CAN CREATE STAFF ACCOUNTS (Strict PDF requirement)
export const createStaff = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Only an Admin can create staff accounts.' });
      return;
    }

    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      return;
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      res.status(400).json({ success: false, message: passwordCheck.reason });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'A user with this email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const staff = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: 'STAFF',
        phone,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully.',
      staff,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// LIST USERS (Scoped by role)
export const listUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const roleFilter = req.query.role as string | undefined;

    // Customers can only see themselves
    if (req.user?.role === 'CUSTOMER') {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { id: true, name: true, email: true, role: true, phone: true, companyName: true },
      });
      res.json({ success: true, users: user ? [user] : [] });
      return;
    }

    // Staff cannot view or manage other staff/admin accounts unless filtering customers
    let whereClause: any = {};
    if (req.user?.role === 'STAFF') {
      whereClause.role = 'CUSTOMER';
    } else if (roleFilter) {
      whereClause.role = roleFilter;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        companyName: true,
        createdAt: true,
        _count: {
          select: {
            subscriptions: true,
            invoices: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
