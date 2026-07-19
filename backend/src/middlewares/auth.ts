import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../database/connection';
import type { JwtPayload } from '../types';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const user = await db('users').where('id', decoded.id).first();
    if (!user || user.status !== 'active') return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未授权访问' });
  }

  const decoded = await verifyToken(authHeader.substring(7));
  if (!decoded) {
    return res.status(401).json({ success: false, message: '令牌无效或已过期' });
  }

  req.user = decoded;
  next();
}

export async function authenticateHeaderOrQuery(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : typeof req.query.token === 'string'
      ? req.query.token
      : '';

  if (!token) {
    return res.status(401).json({ success: false, message: '未授权访问' });
  }

  const decoded = await verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, message: '令牌无效或已过期' });
  }

  req.user = decoded;
  next();
}

export function requireRole(role: 'super_admin' | 'admin') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '未授权访问' });
    }

    if (req.user.role !== 'super_admin' && req.user.role !== role) {
      return res.status(403).json({ success: false, message: '权限不足' });
    }

    next();
  };
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: '未授权访问' });
  }

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ success: false, message: '仅限超级管理员访问' });
  }

  next();
}
