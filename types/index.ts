// types/index.ts - UPDATED WITH RECEPTIONIST SUPPORT

export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  available: boolean;
}

export interface CartItem {
  dish: Dish;
  quantity: number;
}

// 🆕 NEW: User role type
export type UserRole = 'customer' | 'receptionist' | 'admin';

// 🆕 UPDATED: Customer interface with role and customerNumber
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string; // 🆕 NEW - Optional phone number
  profilePhoto?: string; // 🆕 NEW - Optional profile photo URL
  customerNumber: number;
  role: UserRole;
  paymentType: 'cash' | 'monthly';
  monthlyBalance: number;
  totalSpent: number;
  isFirstLogin: boolean;
  password?: string;
  registeredAt: string;
}

// 🆕 UPDATED: Order interface with placedBy tracking
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
  placedBy?: string;             // 🆕 NEW: Email of receptionist who placed the order
  placedByName?: string;         // 🆕 NEW: Name of receptionist
  isWalkIn?: boolean;            // 🆕 NEW: True if walk-in customer
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

// 🆕 UPDATED: AuthState with role support
export interface AuthState {
  isAuthenticated: boolean;
  userType: 'customer' | 'admin' | 'receptionist' | null;  // 🆕 Added receptionist
  currentUser: Customer | null;
}

// 🆕 NEW: Permission types for role-based access control
export type Permission = 
  | 'view_menu'
  | 'place_order'
  | 'place_order_for_others'    // Receptionist can order for customers
  | 'approve_orders'
  | 'view_all_orders'
  | 'search_customers'
  | 'print_receipt'
  | 'manage_dishes'             // Admin only
  | 'manage_customers'          // Admin only
  | 'view_analytics';           // Admin only

// 🆕 NEW: Role-Permission mapping
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

// 🆕 NEW: Helper function to check permissions
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

// 🆕 NEW: Walk-in customer template
export const WALK_IN_CUSTOMER_TEMPLATE = {
  id: 'walk-in',
  email: 'walkin@restaurant.com',
  paymentType: 'cash' as const,
  role: 'customer' as const,
};