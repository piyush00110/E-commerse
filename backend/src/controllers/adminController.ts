import { Response, NextFunction } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { ApiError } from '../utils/apiError';
import { AuthRequest } from '../types';

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: users || [] });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    if (!['user', 'admin'].includes(role)) {
      throw new ApiError(400, 'Invalid role. Must be "user" or "admin"');
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { role },
    });

    if (authError) throw new ApiError(500, authError.message);

    const { data: user, error: dbError } = await supabase
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, name, email, role')
      .single();

    if (dbError || !user) throw new ApiError(500, 'Failed to update user role');

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      { count: userCount },
      { count: productCount },
      { count: orderCount },
      { data: revenueData },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('total_price').eq('is_paid', true),
    ]);

    const totalRevenue = (revenueData || []).reduce((sum: number, o: any) => sum + (o.total_price || 0), 0);

    res.json({
      success: true,
      data: {
        totalUsers: userCount || 0,
        totalProducts: productCount || 0,
        totalOrders: orderCount || 0,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      throw new ApiError(400, 'Email, password, and name are required');
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: 'admin' },
    });

    if (authError) {
      if (authError.message?.includes('already registered')) {
        throw new ApiError(400, 'User already exists');
      }
      throw new ApiError(500, authError.message || 'Failed to create user');
    }

    if (!authData.user) throw new ApiError(500, 'Failed to create user');

    const userId = authData.user.id;

    const { data: user, error: dbError } = await supabase
      .from('users')
      .insert({ id: userId, name, email, role: 'admin' })
      .select('id, name, email, role')
      .single();

    if (dbError || !user) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new ApiError(500, 'Failed to create admin profile');
    }

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
