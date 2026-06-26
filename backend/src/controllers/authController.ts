import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase';
import { generateToken } from '../utils/generateToken';
import { ApiError } from '../utils/apiError';
import { mapUser } from '../utils/mapFields';
import { AuthRequest } from '../types';

export const register = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
    if (existing) {
      throw new ApiError(400, 'User already exists');
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data: user, error } = await supabase
      .from('users')
      .insert({ name, email, password: hashedPassword })
      .select('id, name, email, role')
      .single();

    if (error || !user) throw new ApiError(500, 'Failed to create user');

    const token = generateToken(user.id, user.role);
    res.status(201).json({
      success: true,
      data: mapUser({ ...user, token }),
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error || !user || !(await bcrypt.compare(password, user.password))) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const token = generateToken(user.id, user.role);
    res.json({
      success: true,
      data: mapUser({ ...user, token }),
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, avatar, address, created_at, updated_at')
      .eq('id', req.user!.id)
      .single();

    if (error || !user) throw new ApiError(404, 'User not found');

    res.json({ success: true, data: mapUser(user) });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, address, password } = req.body;
    const updates: Record<string, unknown> = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (address) updates.address = address;
    if (password) {
      const salt = await bcrypt.genSalt(12);
      updates.password = await bcrypt.hash(password, salt);
    }
    updates.updated_at = new Date().toISOString();

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user!.id)
      .select('id, name, email, role, avatar, address, created_at, updated_at')
      .single();

    if (error || !user) throw new ApiError(404, 'User not found');

    res.json({ success: true, data: mapUser(user) });
  } catch (error) {
    next(error);
  }
};
