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
  paidAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  paymentType: 'cash' | 'monthly';
  monthlyBalance: number;
  totalSpent: number;
  isFirstLogin: boolean;
  password?: string;  // Make sure this is here
  registeredAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  userType: 'customer' | 'admin' | null;
  currentUser: Customer | null;
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