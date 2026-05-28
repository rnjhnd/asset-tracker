import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.status(401).json({ error: 'Access token missing' });

  jwt.verify(token, process.env.JWT_SECRET || 'secret', async (err: any, decodedUser: any) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    
    try {
      // Re-verify the user against the database to ensure they are still active
      // and their role hasn't been changed since the token was issued.
      const dbUser = await prisma.user.findUnique({ where: { id: decodedUser.userId } });
      
      if (!dbUser) {
        return res.status(403).json({ error: 'User no longer exists' });
      }
      
      if (!dbUser.isActive) {
        return res.status(403).json({ error: 'Account has been deactivated' });
      }

      req.user = {
        userId: dbUser.id,
        role: dbUser.role // Use real-time role from DB, not the potentially stale one in JWT
      };
      
      next();
    } catch (dbErr) {
      return res.status(500).json({ error: 'Internal server error during authentication' });
    }
  });
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  next();
};
