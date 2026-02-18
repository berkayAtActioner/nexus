import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { findUserById, ServerUser } from '../services/db';

export interface AuthRequest extends Request {
  user?: ServerUser;
  userId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = findUserById(decoded.userId);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }
    req.user = user;
    req.userId = user.id;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function generateJwt(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: 'refresh' }, process.env.JWT_SECRET!, { expiresIn: '30d' });
}
