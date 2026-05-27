import { Router } from 'express';
import prisma from '../db';
import bcrypt from 'bcryptjs';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Get User Statistics (Admin Only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [total, active, deactivated, admins] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.user.count({ where: { role: 'ADMIN' } })
    ]);

    res.json({ total, active, deactivated, admins });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Get all users (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      page = '1', 
      limit = '15', 
      search = '', 
      role = 'ALL',
      status = 'ALL',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build where clause
    const whereClause: any = {};
    
    if (role !== 'ALL') {
      whereClause.role = role;
    }

    if (status !== 'ALL') {
      whereClause.isActive = status === 'ACTIVE';
    }

    if (search) {
      whereClause.email = { contains: search as string, mode: 'insensitive' };
    }

    // Build orderBy clause
    const validSortFields = ['email', 'role', 'isActive', 'createdAt', 'department'];
    const validSortOrders = ['asc', 'desc'];
    
    const sortField = validSortFields.includes(sortBy as string) ? (sortBy as string) : 'createdAt';
    const sortDir = validSortOrders.includes(sortOrder as string) ? (sortOrder as string) : 'desc';

    const orderByClause = [
      { [sortField]: sortDir },
      { id: 'asc' }
    ];

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          role: true,
          department: true,
          createdAt: true,
          isActive: true,
          resetRequested: true,
        },
        orderBy: orderByClause,
        skip,
        take: limitNumber
      }),
      prisma.user.count({ where: whereClause })
    ]);

    res.json({
      data: users,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Toggle user active status (Admin only)
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Prevent admin from deactivating themselves or other admins
    if (user.id === req.user?.userId) {
      return res.status(400).json({ error: 'You cannot deactivate your own account.' });
    }
    if (user.role === 'ADMIN' && user.isActive) {
      return res.status(400).json({ error: 'Cannot deactivate an ADMIN account.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive }
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Force reset user password (Admin only)
router.put('/:id/force-password', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { id },
      data: { passwordHash: hashedPassword, resetRequested: false }
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
