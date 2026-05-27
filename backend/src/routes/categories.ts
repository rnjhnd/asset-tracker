import { Router } from 'express';
import prisma from '../db';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Get all categories
router.get('/', authenticateToken, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create new category (Admin Only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const uppercaseName = name.trim().toUpperCase();

    // Check if exists
    const existing = await prisma.category.findUnique({
      where: { name: uppercaseName }
    });

    if (existing) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    const newCategory = await prisma.category.create({
      data: { name: uppercaseName }
    });

    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

export default router;
