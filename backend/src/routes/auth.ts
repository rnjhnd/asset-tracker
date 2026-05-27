import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// REGISTER ROUTE
router.post('/register', async (req, res) => {
  try {
    let { email, password, name, role, department } = req.body;



    // Auto-capitalize name (Title Case)
    if (name) {
      name = name
        .toLowerCase()
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    // Check if name or email exists separately
    const existingNameUser = await prisma.user.findFirst({
      where: { name: name || 'Unknown Employee' }
    });
    if (existingNameUser) {
      return res.status(400).json({ error: 'Name already exists' });
    }

    const existingEmailUser = await prisma.user.findUnique({
      where: { email }
    });
    if (existingEmailUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Validate password
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        name: name || 'Unknown Employee',
        passwordHash,
        role: role || 'EMPLOYEE',
        department: department || 'UNASSIGNED',
        isActive: true,
      },
    });

    res.status(201).json({ message: 'User registered successfully', userId: newUser.id });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// LOGIN ROUTE
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) return res.status(403).json({ error: 'Account has been deactivated. Please contact an administrator.' });

    // Generate JWT
    const payload = {
      userId: user.id,
      role: user.role,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// CHANGE PASSWORD ROUTE
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: 'Incorrect current password' });

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password Update Error:', error);
    res.status(500).json({ error: 'Server error during password update' });
  }
});

// REQUEST PASSWORD RESET ROUTE
router.post('/request-reset', async (req, res) => {
  try {
    const { email } = req.body;
    
    // We intentionally don't return 404 to prevent email enumeration,
    // we just silently succeed or update if user exists.
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { resetRequested: true },
      });
    }

    res.json({ message: 'Password reset request sent successfully' });
  } catch (error) {
    console.error('Request Reset Error:', error);
    res.status(500).json({ error: 'Server error during password reset request' });
  }
});

export default router;
