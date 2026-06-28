import { Response, NextFunction } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { ApiError } from '../utils/apiError';
import { mapUser } from '../utils/mapFields';
import { AuthRequest } from '../types';

export const register = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: 'user' },
    });

    if (authError || !authData.user) {
      if (authError?.message?.includes('already registered')) {
        throw new ApiError(400, 'User already exists');
      }
      throw new ApiError(500, authError?.message || 'Failed to create user');
    }

    const userId = authData.user.id;

    const { data: user, error: dbError } = await supabase
      .from('users')
      .insert({ id: userId, name, email, role: 'user' })
      .select('id, name, email, role')
      .single();

    if (dbError || !user) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new ApiError(500, 'Failed to create user profile');
    }

    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !sessionData.session) {
      throw new ApiError(500, 'Failed to create session');
    }

    res.status(201).json({
      success: true,
      data: mapUser({ ...user, token: sessionData.session.access_token }),
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !sessionData.session) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const userId = sessionData.user.id;

    const { data: user, error: dbError } = await supabase
      .from('users')
      .select('id, name, email, role, avatar, address')
      .eq('id', userId)
      .maybeSingle();

    if (dbError || !user) {
      throw new ApiError(404, 'User not found');
    }

    res.json({
      success: true,
      data: mapUser({ ...user, token: sessionData.session.access_token }),
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
    updates.updated_at = new Date().toISOString();

    if (email) {
      const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(
        req.user!.id,
        { email }
      );
      if (emailError) throw new ApiError(500, emailError.message);
    }

    if (password) {
      const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(
        req.user!.id,
        { password }
      );
      if (pwError) throw new ApiError(500, pwError.message);
    }

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