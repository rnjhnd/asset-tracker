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
    const validSortFields = ['name', 'email', 'role', 'isActive', 'createdAt', 'department'];
    const validSortOrders = ['asc', 'desc'];
    
    const sortField = validSortFields.includes(sortBy as string) ? (sortBy as string) : 'name';
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
          name: true,
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
// Edit user details (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  let { name, email, role, department } = req.body;
  
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Auto-capitalize name
    if (name) {
      name = name
        .toLowerCase()
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    // Check for duplicate name or email separately
    const existingNameUser = await prisma.user.findFirst({
      where: {
        id: { not: id },
        name: name || user.name
      }
    });
    if (existingNameUser) {
      return res.status(400).json({ error: 'Name already exists' });
    }

    const existingEmailUser = await prisma.user.findFirst({
      where: {
        id: { not: id },
        email
      }
    });
    if (existingEmailUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: name || user.name,
        email: email || user.email,
        role: role || user.role,
        department: department || user.department
      },
      select: {
        id: true, email: true, name: true, role: true, department: true, isActive: true, createdAt: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
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
  
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
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

// Hard delete a user (Admin only, requires 0 assignments)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { assignments: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.id === req.user?.userId) return res.status(400).json({ error: 'You cannot delete your own account.' });
    if (user.role === 'ADMIN') return res.status(400).json({ error: 'Cannot delete an ADMIN account.' });
    if (user.assignments.length > 0) {
      return res.status(400).json({ error: 'Cannot delete a user with existing or past asset assignments. Deactivate them instead.' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User permanently deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});
export default router;
