import { supabase } from './supabase';

export const connectDB = async (): Promise<boolean> => {
  const { error } = await supabase.from('users').select('id', { count: 'exact', head: true });
  if (error) {
    console.error('Supabase connection failed:', error.message);
    throw error;
  }
  console.log('Supabase connected');
  return true;
};

export const disconnectDB = async (): Promise<void> => {
  // Supabase client doesn't need explicit disconnect
};
