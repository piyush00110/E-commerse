import { Request } from 'express';

export interface IUser {
  id?: string;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  avatar?: string;
  address?: IAddress;
  created_at?: string;
  updated_at?: string;
}

export interface IAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

export interface IProduct {
  id?: string;
  name: string;
  description: string;
  price: number;
  compare_price?: number;
  images: string[];
  category_id: string;
  brand?: string;
  count_in_stock: number;
  rating: number;
  num_reviews: number;
  features?: string[];
  is_featured?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ICategory {
  id?: string;
  name: string;
  slug: string;
  image?: string;
  parent_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ICartItem {
  id?: string;
  cart_id?: string;
  product_id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface ICart {
  id?: string;
  user_id: string;
  items?: ICartItem[];
  created_at?: string;
  updated_at?: string;
}

export interface IOrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface IOrder {
  id?: string;
  user_id: string;
  items?: IOrderItem[];
  shipping_address: IAddress;
  payment_method: string;
  payment_result?: {
    id: string;
    status: string;
    update_time: string;
    email_address: string;
  };
  tax_price: number;
  shipping_price: number;
  total_price: number;
  is_paid: boolean;
  paid_at?: string;
  is_delivered: boolean;
  delivered_at?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

export interface IReview {
  id?: string;
  user_id: string;
  product_id: string;
  name: string;
  rating: number;
  title: string;
  comment: string;
  created_at?: string;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sort?: string;
  category?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  rating?: string;
}
