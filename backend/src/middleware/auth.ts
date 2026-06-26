import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthRequest } from '../types';
import { ApiError } from '../utils/apiError';

interface JwtPayload {
  id: string;
  role: string;
}

export const protect = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized, no token');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch {
    throw new ApiError(401, 'Not authorized, token failed');
  }
};

export const adminOnly = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin') {
    throw new ApiError(403, 'Not authorized as admin');
  }
  next();
};
