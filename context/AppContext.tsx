import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { CartItem, Order, Dish, Customer, MonthlyBill } from '../types';
import { mockDishes } from '../data/mockData';
import { supabase } from "../app/lib/supabase";


interface AppState {
  cart: CartItem[];
  orders: Order[];
  customers: Customer[];
  dishes: Dish[];
  monthlyBills: MonthlyBill[];
  isLoading: boolean;
}

type AppAction =
  | { type: 'ADD_TO_CART'; dish: Dish }
  | { type: 'REMOVE_FROM_CART'; dishId: string }
  | { type: 'UPDATE_QUANTITY'; dishId: string; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'PLACE_ORDER'; customerId: string; customerName: string; customerEmail: string; paymentType: 'cash' | 'monthly' }
  | { type: 'UPDATE_ORDER_STATUS'; orderId: string; status: 'approved' | 'rejected' }
  | { type: 'ADD_CUSTOMER'; customer: Customer }
  | { type: 'UPDATE_CUSTOMER'; customerId: string; updates: Partial<Customer> }
  | { type: 'SET_CUSTOMERS'; customers: Customer[] }
  | { type: 'ADD_DISH'; dish: Dish }
  | { type: 'UPDATE_DISH'; dishId: string; updates: Partial<Dish> }
  | { type: 'DELETE_DISH'; dishId: string }
  | { type: 'GENERATE_MONTHLY_BILL'; customerId: string }
  | { type: 'MARK_BILL_PAID'; billId: string }
  | { type: 'SET_LOADING'; loading: boolean };

const initialState: AppState = {
  cart: [],
  orders: [],
  customers: [],
  dishes: mockDishes,
  monthlyBills: [],
  isLoading: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingItem = state.cart.find(item => item.dish.id === action.dish.id);
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.dish.id === action.dish.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...state,
        cart: [...state.cart, { dish: action.dish, quantity: 1 }],
      };
    }
    
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.dish.id !== action.dishId),
      };
    
    case 'UPDATE_QUANTITY':
      if (action.quantity === 0) {
        return {
          ...state,
          cart: state.cart.filter(item => item.dish.id !== action.dishId),
        };
      }
      return {
        ...state,
        cart: state.cart.map(item =>
          item.dish.id === action.dishId
            ? { ...item, quantity: action.quantity }
            : item
        ),
      };
    
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    
    case 'PLACE_ORDER': {
      const totalAmount = state.cart.reduce(
        (sum, item) => sum + item.dish.price * item.quantity,
        0
      );
      
      const newOrder: Order = {
        id: Date.now().toString(),
        customerId: action.customerId,
        customerName: action.customerName,
        customerEmail: action.customerEmail,
        items: [...state.cart],
        totalAmount,
        status: 'pending',
        paymentType: action.paymentType,
        createdAt: new Date().toISOString(),
      };
      
      return {
        ...state,
        cart: [],
        orders: [newOrder, ...state.orders],
      };
    }
    
    case 'UPDATE_ORDER_STATUS': {
      const updatedOrders = state.orders.map(order => {
        if (order.id === action.orderId) {
          const updatedOrder = {
            ...order,
            status: action.status,
            [action.status === 'approved' ? 'approvedAt' : 'rejectedAt']: new Date().toISOString(),
          };
          
          // If approved and monthly payment, add to customer's balance
          if (action.status === 'approved' && order.paymentType === 'monthly') {
            const customerIndex = state.customers.findIndex(c => c.id === order.customerId);
            if (customerIndex !== -1) {
              state.customers[customerIndex].monthlyBalance += order.totalAmount;
              state.customers[customerIndex].totalSpent += order.totalAmount;
            }
          }
          
          return updatedOrder;
        }
        return order;
      });
      
      return { ...state, orders: updatedOrders };
    }
    
    case 'SET_CUSTOMERS':
      return {
        ...state,
        customers: action.customers,
      };

    case 'ADD_CUSTOMER':
      return {
        ...state,
        customers: [...state.customers, action.customer],
      };

    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map(customer =>
          customer.id === action.customerId
            ? { ...customer, ...action.updates }
            : customer
        ),
      };
    
    case 'ADD_DISH':
      return {
        ...state,
        dishes: [...state.dishes, action.dish],
      };
    
    case 'UPDATE_DISH':
      return {
        ...state,
        dishes: state.dishes.map(dish =>
          dish.id === action.dishId
            ? { ...dish, ...action.updates }
            : dish
        ),
      };
    
    case 'DELETE_DISH':
      return {
        ...state,
        dishes: state.dishes.filter(dish => dish.id !== action.dishId),
      };
    
    case 'GENERATE_MONTHLY_BILL': {
      const customer = state.customers.find(c => c.id === action.customerId);
      if (!customer || customer.monthlyBalance === 0) return state;
      
      const customerOrders = state.orders.filter(
        order => order.customerId === action.customerId && 
                order.status === 'approved' && 
                order.paymentType === 'monthly'
      );
      
      const currentDate = new Date();
      const bill: MonthlyBill = {
        id: Date.now().toString(),
        customerId: action.customerId,
        month: currentDate.toLocaleDateString('en-US', { month: 'long' }),
        year: currentDate.getFullYear(),
        orders: customerOrders,
        totalAmount: customer.monthlyBalance,
        isPaid: false,
        generatedAt: new Date().toISOString(),
      };
      
      return {
        ...state,
        monthlyBills: [...state.monthlyBills, bill],
      };
    }
    
    case 'MARK_BILL_PAID': {
      const updatedBills = state.monthlyBills.map(bill =>
        bill.id === action.billId
          ? { ...bill, isPaid: true, paidAt: new Date().toISOString() }
          : bill
      );
      
      const bill = state.monthlyBills.find(b => b.id === action.billId);
      if (bill) {
        const updatedCustomers = state.customers.map(customer =>
          customer.id === bill.customerId
            ? { ...customer, monthlyBalance: 0 }
            : customer
        );
        
        return {
          ...state,
          monthlyBills: updatedBills,
          customers: updatedCustomers,
        };
      }
      
      return { ...state, monthlyBills: updatedBills };
    }

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.loading,
      };
    
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  fetchCustomersFromSupabase: () => Promise<void>;
  addCustomerToSupabase: (customer: Customer, adminEmail: string) => Promise<void>;
  updateCustomerInSupabase: (customerId: string, updates: Partial<Customer>) => Promise<void>;
} | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Fetch customers from Supabase when app loads
  useEffect(() => {
    fetchCustomersFromSupabase();
  }, []);

  const fetchCustomersFromSupabase = async () => {
    try {
      dispatch({ type: 'SET_LOADING', loading: true });
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('registered_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch error:', error);
        throw error;
      }

      const customers: Customer[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        paymentType: row.payment_type as 'cash' | 'monthly',
        monthlyBalance: parseFloat(row.monthly_balance) || 0,
        totalSpent: parseFloat(row.total_spent) || 0,
        isFirstLogin: row.is_first_login,
        registeredAt: row.registered_at,
      }));

      dispatch({ type: 'SET_CUSTOMERS', customers });
    } catch (error: any) {
      console.error('Error fetching customers:', error.message);
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  };

  const addCustomerToSupabase = async (customer: Customer, adminEmail: string) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          clerk_user_id: customer.id,
          name: customer.name,
          email: customer.email,
          payment_type: customer.paymentType,
          monthly_balance: 0,
          total_spent: 0,
          is_first_login: true,
          created_by_admin_email: adminEmail,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      const newCustomer: Customer = {
        id: data.id,
        name: data.name,
        email: data.email,
        paymentType: data.payment_type as 'cash' | 'monthly',
        monthlyBalance: 0,
        totalSpent: 0,
        isFirstLogin: true,
        registeredAt: data.registered_at,
      };

      dispatch({ type: 'ADD_CUSTOMER', customer: newCustomer });
    } catch (error: any) {
      console.error('Error adding customer:', error.message);
      throw error;
    }
  };

  const updateCustomerInSupabase = async (customerId: string, updates: Partial<Customer>) => {
    try {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.paymentType !== undefined) updateData.payment_type = updates.paymentType;
      if (updates.monthlyBalance !== undefined) updateData.monthly_balance = updates.monthlyBalance;
      if (updates.totalSpent !== undefined) updateData.total_spent = updates.totalSpent;
      if (updates.isFirstLogin !== undefined) updateData.is_first_login = updates.isFirstLogin;

      const { error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', customerId);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      dispatch({ type: 'UPDATE_CUSTOMER', customerId, updates });
    } catch (error: any) {
      console.error('Error updating customer:', error.message);
      throw error;
    }
  };

  return (
    <AppContext.Provider 
      value={{ 
        state, 
        dispatch,
        fetchCustomersFromSupabase,
        addCustomerToSupabase,
        updateCustomerInSupabase,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}