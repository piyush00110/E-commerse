import { Response, NextFunction } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
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
    if (error || !data?.user) {
      throw new ApiError(401, 'Not authorized, token failed');
    }

    const userId = data.user.id;
    let role = data.user.user_metadata?.role || 'user';

    const { data: dbUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (dbUser) {
      role = dbUser.role || role;
    }

    req.user = { id: userId, role };
    next();
  } catch (error) {
    next(error);
  }
};

export const adminOnly = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  try {
    if (req.user?.role !== 'admin') {
      throw new ApiError(403, 'Not authorized as admin');
    }
    next();
  } catch (error) {
    next(error);
  }
};
