import { Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { ApiError } from '../utils/apiError';
import { AuthRequest } from '../types';
import { mapCategories, mapCategory } from '../utils/mapFields';

export const getCategories = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;
    res.json({ success: true, data: mapCategories(categories || []) });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data: category, error } = await supabase
      .from('categories')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data: mapCategory(category) });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updates = { ...req.body, updated_at: new Date().toISOString() };
    const { data: category, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !category) throw new ApiError(404, 'Category not found');
    res.json({ success: true, data: mapCategory(category) });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error, count } = await supabase
      .from('categories')
      .delete({ count: 'exact' })
      .eq('id', req.params.id);

    if (error) throw error;
    if (count === 0) throw new ApiError(404, 'Category not found');
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
};
