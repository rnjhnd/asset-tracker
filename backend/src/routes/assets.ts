import { Router } from 'express';
import prisma from '../db';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all assets (Open to all authenticated users, filtered by role)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const role = req.user?.role;
    const userId = req.user?.userId;

    const { 
      page = '1', 
      limit = '15', 
      search = '', 
      status = 'ALL',
      category = 'ALL',
      sortBy = 'purchaseDate',
      sortOrder = 'desc'
    } = req.query;
    
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build the query where clause
    const whereClause: any = {};
    
    if (status !== 'ALL') {
      whereClause.status = status;
    }

    if (category !== 'ALL') {
      whereClause.category = { name: category };
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

    // Build the query orderBy clause
    const validSortFields = ['name', 'serialNumber', 'category', 'status', 'purchaseDate', 'employee'];
    const validSortOrders = ['asc', 'desc'];
    
    const sortField = validSortFields.includes(sortBy as string) ? (sortBy as string) : 'purchaseDate';
    const sortDir = validSortOrders.includes(sortOrder as string) ? (sortOrder as string) : 'desc';

    let orderByClause: any = [
      { [sortField]: sortDir },
      { id: 'asc' }
    ];

    if (sortField === 'employee' || sortField === 'category') {
      orderByClause = { id: 'asc' }; // Remove Prisma sorting, we'll sort in JS
    }

    let assets = await prisma.asset.findMany({
      where: whereClause,
      include: {
        category: true,
        assignments: {
          where: { returnDate: null },
          include: { user: { select: { email: true, name: true } } }
        }
      },
      orderBy: orderByClause,
    });

    // Handle JS sorting for complex relations
    if (sortField === 'employee') {
      assets.sort((a: any, b: any) => {
        const emailA = a.assignments[0]?.user?.email || '';
        const emailB = b.assignments[0]?.user?.email || '';
        return sortDir === 'asc' ? emailA.localeCompare(emailB) : emailB.localeCompare(emailA);
      });
    } else if (sortField === 'category') {
      assets.sort((a: any, b: any) => {
        const catA = a.category?.name || '';
        const catB = b.category?.name || '';
        return sortDir === 'asc' ? catA.localeCompare(catB) : catB.localeCompare(catA);
      });
    }

    const total = assets.length;
    const paginatedAssets = assets.slice(skip, skip + limitNumber);

    res.json({
      data: paginatedAssets.map((a: any) => ({ ...a, category: a.category?.name || 'UNKNOWN' })),
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
    
    // Find or create category
    let catRecord = await prisma.category.findUnique({ where: { name: category } });
    if (!catRecord) {
      catRecord = await prisma.category.create({ data: { name: category } });
    }

    const newAsset = await prisma.asset.create({
      data: {
        name,
        serialNumber,
        categoryId: catRecord.id,
        purchaseDate: new Date(purchaseDate),
      }
    });
    res.status(201).json(newAsset);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create asset. Serial number might be duplicate.' });
  }
});

// Edit Asset Details (Admin Only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, serialNumber } = req.body;
    
    // Check if serial number belongs to another asset
    if (serialNumber) {
      const existing = await prisma.asset.findUnique({ where: { serialNumber } });
      if (existing && existing.id !== id) {
        return res.status(400).json({ error: 'Serial number already in use' });
      }
    }

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(serialNumber && { serialNumber })
      }
    });
    
    res.json(updatedAsset);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

// Get Asset Statistics (Admin Only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [total, available, assigned, maintenance, retired, allAssets, allAssignments] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: 'AVAILABLE' } }),
      prisma.asset.count({ where: { status: 'ASSIGNED' } }),
      prisma.asset.count({ where: { status: 'MAINTENANCE' } }),
      prisma.asset.count({ where: { status: 'RETIRED' } }),
      prisma.asset.findMany({ select: { category: true, purchaseDate: true } }),
      prisma.assignment.findMany({ select: { checkoutDate: true } })
    ]);

    // 1. Category & Aging Stats
    const categoryCounts: Record<string, number> = {};
    const purchaseYearCounts: Record<string, number> = {};
    
    allAssets.forEach((asset: any) => {
      // Category count
      const catName = asset.category?.name || 'UNKNOWN';
      categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
      
      // Aging count by purchase year
      if (asset.purchaseDate) {
        const year = new Date(asset.purchaseDate).getFullYear().toString();
        purchaseYearCounts[year] = (purchaseYearCounts[year] || 0) + 1;
      }
    });

    const categoryStats = Object.keys(categoryCounts).map(name => ({
      name,
      value: categoryCounts[name]
    })).sort((a, b) => b.value - a.value);

    const agingStats = Object.keys(purchaseYearCounts).map(year => ({
      year,
      count: purchaseYearCounts[year]
    })).sort((a, b) => a.year.localeCompare(b.year));

    // 2. Timeline Stats (Assignments in the last 6 months)
    const monthCounts: Record<string, number> = {};
    const today = new Date();
    
    // Initialize last 6 months with 0
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('default', { month: 'short' });
      monthCounts[monthLabel] = 0;
    }

    allAssignments.forEach(assignment => {
      if (assignment.checkoutDate) {
        const checkoutDate = new Date(assignment.checkoutDate);
        // Check if within last 6 months
        const diffMonths = (today.getFullYear() - checkoutDate.getFullYear()) * 12 + (today.getMonth() - checkoutDate.getMonth());
        if (diffMonths >= 0 && diffMonths < 6) {
          const monthLabel = checkoutDate.toLocaleString('default', { month: 'short' });
          if (monthCounts[monthLabel] !== undefined) {
            monthCounts[monthLabel]++;
          }
        }
      }
    });

    const timelineStats = Object.keys(monthCounts).map(month => ({
      month,
      assignments: monthCounts[month]
    }));

    res.json({ 
      total, 
      available, 
      assigned, 
      maintenance, 
      retired,
      categoryStats,
      agingStats,
      timelineStats
    });
  } catch (error) {
    console.error('Stats error:', error);
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

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (targetUser.role === 'ADMIN') {
      return res.status(400).json({ error: 'Cannot assign assets to an ADMIN' });
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
        user: { select: { email: true, name: true } }
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
