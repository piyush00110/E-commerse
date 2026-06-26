export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
  address?: Address;
  token?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  images: string[];
  category: Category | string;
  brand?: string;
  countInStock: number;
  rating: number;
  numReviews: number;
  features?: string[];
  isFeatured: boolean;
  reviews?: Review[];
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
}

export interface CartItem {
  _id?: string;
  product: string | Product;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  totalPrice: number;
  totalItems: number;
}

export interface Order {
  _id: string;
  user: string | User;
  items: OrderItem[];
  shippingAddress: Address;
  paymentMethod: string;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface OrderItem {
  product: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface Review {
  _id: string;
  user: string;
  name: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
