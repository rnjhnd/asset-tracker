import { Router } from 'express';
import prisma from '../db';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all assets (Open to all authenticated users, filtered by role)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const role = req.user?.role;
    const userId = req.user?.userId;

    const { page = '1', limit = '15', search = '', status = 'ALL' } = req.query;
    
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build the query where clause
    const whereClause: any = {};
    
    if (status !== 'ALL') {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { serialNumber: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Role-based visibility
    if (req.user?.role === 'EMPLOYEE') {
      whereClause.assignments = {
        some: { userId: req.user.userId, returnDate: null }
      };
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where: whereClause,
        include: {
          assignments: {
            where: { returnDate: null },
            include: { user: { select: { email: true } } }
          }
        },
        orderBy: { purchaseDate: 'desc' },
        skip,
        take: limitNumber
      }),
      prisma.asset.count({ where: whereClause })
    ]);

    res.json({
      data: assets,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

// Create Asset (Admin Only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, serialNumber, category, purchaseDate } = req.body;
    const newAsset = await prisma.asset.create({
      data: {
        name,
        serialNumber,
        category,
        purchaseDate: new Date(purchaseDate),
      }
    });
    res.status(201).json(newAsset);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create asset. Serial number might be duplicate.' });
  }
});

// Get Asset Statistics (Admin Only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [total, available, assigned, maintenance] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: 'AVAILABLE' } }),
      prisma.asset.count({ where: { status: 'ASSIGNED' } }),
      prisma.asset.count({ where: { status: 'MAINTENANCE' } })
    ]);

    res.json({ total, available, assigned, maintenance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Bulk Create Assets (Admin Only)
router.post('/bulk', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const assets = req.body; // Array of { name, serialNumber, category }
    if (!Array.isArray(assets) || assets.length === 0) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    const created = await prisma.asset.createMany({
      data: assets.map(a => ({
        name: a.name,
        serialNumber: a.serialNumber,
        category: a.category || 'LAPTOP',
        status: 'AVAILABLE'
      })),
      skipDuplicates: true // Ignores duplicate serial numbers safely
    });

    res.status(201).json({ message: `Successfully imported ${created.count} assets` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk import assets' });
  }
});

// Assign an asset to a user (Admin only)
router.post('/:id/assign', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset || asset.status !== 'AVAILABLE') {
      return res.status(400).json({ error: 'Asset not found or not available' });
    }

    // Create assignment and update asset status in a transaction
    const transaction = await prisma.$transaction([
      prisma.assignment.create({
        data: { assetId: id, userId }
      }),
      prisma.asset.update({
        where: { id },
        data: { status: 'ASSIGNED' }
      })
    ]);

    res.json({ message: 'Asset assigned successfully', assignment: transaction[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign asset' });
  }
});

// Return an asset (Admin only)
router.post('/:id/return', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the active assignment
    const activeAssignment = await prisma.assignment.findFirst({
      where: { assetId: id, returnDate: null }
    });

    if (!activeAssignment) {
      return res.status(400).json({ error: 'No active assignment found for this asset' });
    }

    // Update assignment and asset status in a transaction
    await prisma.$transaction([
      prisma.assignment.update({
        where: { id: activeAssignment.id },
        data: { returnDate: new Date() }
      }),
      prisma.asset.update({
        where: { id },
        data: { status: 'AVAILABLE' }
      })
    ]);

    res.json({ message: 'Asset returned successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to return asset' });
  }
});

// Get Asset History (Admin Only)
router.get('/:id/history', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const history = await prisma.assignment.findMany({
      where: { assetId: id },
      include: {
        user: { select: { email: true } }
      },
      orderBy: {
        checkoutDate: 'desc'
      }
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch asset history' });
  }
});

// Update Asset Status (Admin Only)
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'MAINTENANCE' | 'RETIRED' | 'AVAILABLE'

  try {
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    // If it's currently assigned, we must return it first before retiring/maintenance
    if (asset.status === 'ASSIGNED') {
      const activeAssignment = await prisma.assignment.findFirst({
        where: { assetId: id, returnDate: null }
      });
      if (activeAssignment) {
        await prisma.assignment.update({
          where: { id: activeAssignment.id },
          data: { returnDate: new Date() }
        });
      }
    }

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: { status }
    });

    res.json(updatedAsset);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update asset status' });
  }
});

export default router;
