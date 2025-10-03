import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { CartItem, Order, Dish, Customer, MonthlyBill } from '../types';
import { mockDishes, mockCustomers } from '../data/mockData';

interface AppState {
  cart: CartItem[];
  orders: Order[];
  customers: Customer[];
  dishes: Dish[];
  monthlyBills: MonthlyBill[];
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
  | { type: 'ADD_DISH'; dish: Dish }
  | { type: 'UPDATE_DISH'; dishId: string; updates: Partial<Dish> }
  | { type: 'DELETE_DISH'; dishId: string }
  | { type: 'GENERATE_MONTHLY_BILL'; customerId: string }
  | { type: 'MARK_BILL_PAID'; billId: string };

const initialState: AppState = {
  cart: [],
  orders: [],
  customers: mockCustomers,
  dishes: mockDishes,
  monthlyBills: [],
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
    
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
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