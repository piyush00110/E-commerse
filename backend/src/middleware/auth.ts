import { Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../types';
import { ApiError } from '../utils/apiError';

export const protect = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new ApiError(401, 'Not authorized, no token');
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      throw new ApiError(401, 'Not authorized, token failed');
    }

    const role = data.user.user_metadata?.role || 'user';
    req.user = { id: data.user.id, role };
    next();
  } catch (error) {
    next(error);
  }
};

export const adminOnly = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin') {
    throw new ApiError(403, 'Not authorized as admin');
  }
  next();
};