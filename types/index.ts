// types/index.ts - UPDATED WITH WAITER/CHEF ROLES AND SALARY

export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  available: boolean;
  stockQuantity?: number | null;
}

export interface CartItem {
  dish: Dish;
  quantity: number;
}

// 🆕 UPDATED: User role type with Waiter and Chef
export type UserRole = 'customer' | 'receptionist' | 'waiter' | 'chef' | 'admin';

// 🆕 UPDATED: Customer interface with Waiter/Chef roles and salary
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profilePhoto?: string;
  customerNumber: number;
  role: 'receptionist' | 'customer' | 'admin' | 'master_admin' | 'waiter' | 'chef';
  paymentType: 'cash' | 'monthly';
  monthlyBalance: number;
  totalSpent: number;
  salary?: number; // 🆕 NEW: Monthly salary for staff
  isFirstLogin: boolean;
  password?: string;
  registeredAt: string;
}
export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected';
  paymentType: 'cash' | 'monthly';
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  placedBy?: string;
  placedByName?: string;
  isWalkIn?: boolean;
}

export interface MonthlyBill {
  id: string;
  customerId: string;
  month: string;
  year: number;
  orders: Order[];
  totalAmount: number;
  isPaid: boolean;
  generatedAt: string;
  paidAt?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  userType: 'customer' | 'admin' | 'receptionist' | 'waiter' | 'chef' | null;  // 🆕 Added waiter & chef
  currentUser: Customer | null;
}

export type Permission =
  | 'view_menu'
  | 'place_order'
  | 'place_order_for_others'
  | 'approve_orders'
  | 'view_all_orders'
  | 'search_customers'
  | 'print_receipt'
  | 'manage_dishes'
  | 'manage_customers'
  | 'view_analytics';

// 🆕 UPDATED: Role-Permission mapping with Waiter and Chef
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  customer: [
    'view_menu',
    'place_order',
  ],
  receptionist: [
    'view_menu',
    'place_order',
    'place_order_for_others',
    'approve_orders',
    'view_all_orders',
    'search_customers',
    'print_receipt',
  ],
  waiter: [ // 🆕 NEW: Waiter permissions
    'view_menu',
    'place_order',
    'place_order_for_others',
    'view_all_orders',
    'search_customers',
  ],
  chef: [ // 🆕 NEW: Chef permissions
    'view_menu',
    'view_all_orders',
  ],
  admin: [
    'view_menu',
    'place_order',
    'place_order_for_others',
    'approve_orders',
    'view_all_orders',
    'search_customers',
    'print_receipt',
    'manage_dishes',
    'manage_customers',
    'view_analytics',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

export const WALK_IN_CUSTOMER_TEMPLATE = {
  id: 'walk-in',
  email: 'walkin@restaurant.com',
  paymentType: 'cash' as const,
  role: 'customer' as const,
};