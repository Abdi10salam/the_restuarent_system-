// context/AppContext.tsx - WITH REAL-TIME UPDATES
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { CartItem, Order, Dish, Customer, MonthlyBill } from '../types';
import { supabase } from "../app/lib/supabase";
import { generateCustomerNumber } from '../app/lib/customer-helpers';
import { ensureWalkInCustomerExists } from '../app/lib/walkin-customer';

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
  | { type: 'SET_DISHES'; dishes: Dish[] }
  | { type: 'ADD_DISH'; dish: Dish }
  | { type: 'UPDATE_DISH'; dishId: string; updates: Partial<Dish> }
  | { type: 'DELETE_DISH'; dishId: string }
  | { type: 'SET_ORDERS'; orders: Order[] }
  | { type: 'ADD_ORDER'; order: Order }
  | { type: 'GENERATE_MONTHLY_BILL'; customerId: string }
  | { type: 'MARK_BILL_PAID'; billId: string }
  | { type: 'SET_LOADING'; loading: boolean };

const initialState: AppState = {
  cart: [],
  orders: [],
  customers: [],
  dishes: [],
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
      const updatedOrders = state.orders.map(order =>
        order.id === action.orderId
          ? {
            ...order,
            status: action.status,
            [action.status === 'approved' ? 'approvedAt' : 'rejectedAt']: new Date().toISOString(),
          }
          : order
      );

      let updatedDishes = state.dishes;
      if (action.status === 'approved') {
        const order = state.orders.find(o => o.id === action.orderId);
        if (order) {
          updatedDishes = state.dishes.map(dish => {
            const orderedItem = order.items.find(item => item.dish.id === dish.id);
            if (orderedItem && dish.stockQuantity !== null && dish.stockQuantity !== undefined) {
              const newStock = dish.stockQuantity - orderedItem.quantity;
              return {
                ...dish,
                stockQuantity: Math.max(0, newStock),
                available: newStock > 0,
              };
            }
            return dish;
          });
        }
      }

      return {
        ...state,
        orders: updatedOrders,
        dishes: updatedDishes,
      };
    }

    case 'SET_CUSTOMERS':
      return { ...state, customers: action.customers };

    case 'ADD_CUSTOMER':
      return { ...state, customers: [...state.customers, action.customer] };

    case 'UPDATE_CUSTOMER': {
      const updatedCustomers = state.customers.map(customer =>
        customer.id === action.customerId
          ? { ...customer, ...action.updates }
          : customer
      );

      console.log('🔄 Customer updated in state:', {
        customerId: action.customerId,
        updates: action.updates,
        newBalance: updatedCustomers.find(c => c.id === action.customerId)?.monthlyBalance
      });

      return {
        ...state,
        customers: updatedCustomers,
      };
    }

    case 'SET_DISHES':
      return { ...state, dishes: action.dishes };

    case 'ADD_DISH':
      return { ...state, dishes: [...state.dishes, action.dish] };

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
      return { ...state, dishes: state.dishes.filter(dish => dish.id !== action.dishId) };

    case 'SET_ORDERS':
      return { ...state, orders: action.orders };

    case 'ADD_ORDER':
      return { ...state, orders: [action.order, ...state.orders] };

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

      return { ...state, monthlyBills: [...state.monthlyBills, bill] };
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

        return { ...state, monthlyBills: updatedBills, customers: updatedCustomers };
      }

      return { ...state, monthlyBills: updatedBills };
    }

    case 'SET_LOADING':
      return { ...state, isLoading: action.loading };

    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  fetchCustomersFromSupabase: () => Promise<void>;
  addCustomerToSupabase: (customer: Customer, adminEmail: string) => Promise<number>;
  updateCustomerInSupabase: (customerId: string, updates: Partial<Customer>) => Promise<void>;
  fetchDishesFromSupabase: () => Promise<void>;
  addDishToSupabase: (dish: Dish, adminEmail: string) => Promise<void>;
  updateDishInSupabase: (dishId: string, updates: Partial<Dish>) => Promise<void>;
  deleteDishFromSupabase: (dishId: string) => Promise<void>;
  fetchOrdersFromSupabase: () => Promise<void>;
  placeOrderToSupabase: (order: Order) => Promise<void>;
  updateOrderStatusInSupabase: (orderId: string, status: 'approved' | 'rejected') => Promise<void>;
} | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    initializeApp();
  }, []);

  // 🆕 REAL-TIME SUBSCRIPTIONS FOR LIVE DASHBOARD UPDATES
  useEffect(() => {

    // Subscribe to orders table changes
    const ordersSubscription = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('📦 Order changed!', payload.eventType, payload.new);
          // Auto-refresh orders when any change happens
          fetchOrdersFromSupabase();
        }
      )
      .subscribe();

    // Subscribe to customers table changes (for balance updates)
    const customersSubscription = supabase
      .channel('customers-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'customers',
        },
        (payload) => {
          console.log('👤 Customer updated!', payload.new);
          // Auto-refresh customers when balance changes
          fetchCustomersFromSupabase();
        }
      )
      .subscribe();

    // Subscribe to dishes table changes (for stock updates)
    const dishesSubscription = supabase
      .channel('dishes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dishes',
        },
        (payload) => {
          console.log('🍽️ Dish changed!', payload.eventType);
          // Auto-refresh dishes
          fetchDishesFromSupabase();
        }
      )
      .subscribe();

    console.log('✅ Real-time subscriptions active');

    // Cleanup subscriptions on unmount
    return () => {
      console.log('🔴 Cleaning up subscriptions...');
      ordersSubscription.unsubscribe();
      customersSubscription.unsubscribe();
      dishesSubscription.unsubscribe();
    };
  }, []); // Empty dependency array - set up once on mount

  const initializeApp = async () => {
    try {
      console.log('🚀 Initializing app...');

      await ensureWalkInCustomerExists();

      await Promise.all([
        fetchCustomersFromSupabase(),
        fetchDishesFromSupabase(),
        fetchOrdersFromSupabase(),
      ]);

      console.log('✅ App initialized successfully');
    } catch (error) {
      console.error('❌ App initialization failed:', error);
    }
  };

  const fetchCustomersFromSupabase = async () => {
    try {
      console.log('📥 Fetching customers from Supabase...');

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('registered_at', { ascending: false });

      if (error) throw error;

      const customers: Customer[] = (data || []).map((dbCustomer: any) => ({
        id: dbCustomer.id,
        name: dbCustomer.name,
        email: dbCustomer.email,
        phone: dbCustomer.phone,
        profilePhoto: dbCustomer.profile_photo,
        customerNumber: dbCustomer.customer_number,
        role: dbCustomer.role || 'customer',
        paymentType: dbCustomer.payment_type,
        monthlyBalance: parseFloat(dbCustomer.monthly_balance) || 0,
        totalSpent: parseFloat(dbCustomer.total_spent) || 0,
        isDisabled: dbCustomer.is_disabled === true,
        salary: dbCustomer.salary !== null && dbCustomer.salary !== undefined
          ? parseFloat(dbCustomer.salary)
          : undefined,
        isFirstLogin: dbCustomer.is_first_login,
        registeredAt: dbCustomer.registered_at,
      }));

      console.log(`✅ Fetched ${customers.length} customers`);
      customers.forEach(c => {
        if (c.monthlyBalance !== 0) {
          console.log(`  📊 ${c.name}: Balance=${c.monthlyBalance}, TotalSpent=${c.totalSpent}`);
        }
      });

      dispatch({ type: 'SET_CUSTOMERS', customers });
    } catch (error: any) {
      console.error('❌ Error fetching customers:', error.message);
    }
  };

  const addCustomerToSupabase = async (customer: Customer, adminEmail: string): Promise<number> => {
    try {
      const customerNumber = customer.role === 'customer'
        ? await generateCustomerNumber()
        : 0;

      const { data, error } = await supabase
        .from('customers')
        .insert({
          clerk_user_id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          profile_photo: customer.profilePhoto,
          customer_number: customerNumber,
          role: customer.role || 'customer',
          payment_type: customer.paymentType,
          monthly_balance: 0,
          total_spent: 0,
          is_disabled: customer.isDisabled ?? false,
          salary: customer.salary ?? null,
          is_first_login: true,
          created_by_admin_email: adminEmail,
        })
        .select()
        .single();

      if (error) throw error;

      const newCustomer: Customer = {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        profilePhoto: data.profile_photo,
        customerNumber: data.customer_number,
        role: data.role || 'customer',
        paymentType: data.payment_type,
        monthlyBalance: 0,
        totalSpent: 0,
        isDisabled: data.is_disabled === true,
        salary: data.salary !== null && data.salary !== undefined
          ? parseFloat(data.salary)
          : undefined,
        isFirstLogin: true,
        registeredAt: data.registered_at,
      };

      dispatch({ type: 'ADD_CUSTOMER', customer: newCustomer });

      return customerNumber;
    } catch (error: any) {
      console.error('❌ Error adding customer:', error.message);
      throw error;
    }
  };

  const updateCustomerInSupabase = async (
    customerId: string,
    updates: Partial<Customer>
  ) => {
    try {
      console.log('💾 Updating customer in Supabase:', { customerId, updates });

      const updateData: any = {};

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.profilePhoto !== undefined) updateData.profile_photo = updates.profilePhoto;
      if (updates.paymentType !== undefined) updateData.payment_type = updates.paymentType;
      if (updates.monthlyBalance !== undefined) updateData.monthly_balance = updates.monthlyBalance;
      if (updates.totalSpent !== undefined) updateData.total_spent = updates.totalSpent;
      if (updates.isFirstLogin !== undefined) updateData.is_first_login = updates.isFirstLogin;
      if (updates.isDisabled !== undefined) updateData.is_disabled = updates.isDisabled;
      if (updates.role !== undefined) updateData.role = updates.role;
      if (updates.customerNumber !== undefined) updateData.customer_number = updates.customerNumber;
      if (updates.salary !== undefined) updateData.salary = updates.salary;

      const { error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', customerId);

      if (error) throw error;

      console.log('✅ Customer updated in Supabase successfully');

      dispatch({ type: 'UPDATE_CUSTOMER', customerId, updates });

      await fetchCustomersFromSupabase();

    } catch (error: any) {
      console.error('❌ Error updating customer:', error.message);
      throw error;
    }
  };

  const fetchDishesFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const dishes: Dish[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        price: parseFloat(row.price),
        category: row.category,
        image: row.image || '',
        available: row.available,
        stockQuantity: row.stock_quantity,
      }));

      dispatch({ type: 'SET_DISHES', dishes });
    } catch (error: any) {
      console.error('Error fetching dishes:', error.message);
    }
  };

  const addDishToSupabase = async (dish: Dish, adminEmail: string) => {
    try {
      const { data, error } = await supabase
        .from('dishes')
        .insert({
          name: dish.name,
          description: dish.description,
          price: dish.price,
          category: dish.category,
          image: dish.image,
          available: dish.available,
          stock_quantity: dish.stockQuantity,
          created_by_admin_email: adminEmail,
        })
        .select()
        .single();

      if (error) throw error;

      const newDish: Dish = {
        id: data.id,
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        category: data.category,
        image: data.image,
        available: data.available,
        stockQuantity: data.stock_quantity,
      };

      dispatch({ type: 'ADD_DISH', dish: newDish });
    } catch (error: any) {
      console.error('Error adding dish:', error.message);
      throw error;
    }
  };

  const updateDishInSupabase = async (dishId: string, updates: Partial<Dish>) => {
    try {
      const updateData: any = {};

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.image !== undefined) updateData.image = updates.image;
      if (updates.available !== undefined) updateData.available = updates.available;
      if (updates.stockQuantity !== undefined) updateData.stock_quantity = updates.stockQuantity;

      const { error } = await supabase
        .from('dishes')
        .update(updateData)
        .eq('id', dishId);

      if (error) throw error;

      dispatch({ type: 'UPDATE_DISH', dishId, updates });
    } catch (error: any) {
      console.error('Error updating dish:', error.message);
      throw error;
    }
  };

  const deleteDishFromSupabase = async (dishId: string) => {
    try {
      const { error } = await supabase
        .from('dishes')
        .delete()
        .eq('id', dishId);

      if (error) throw error;

      dispatch({ type: 'DELETE_DISH', dishId });
    } catch (error: any) {
      console.error('Error deleting dish:', error.message);
      throw error;
    }
  };

  const fetchOrdersFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const orders: Order[] = (data || []).map((row: any) => ({
        id: row.id,
        customerId: row.customer_id,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        items: row.items,
        totalAmount: parseFloat(row.total_amount),
        status: row.status,
        paymentType: row.payment_type,
        createdAt: row.created_at,
        approvedAt: row.approved_at,
        rejectedAt: row.rejected_at,
        placedBy: row.placed_by,
        placedByName: row.placed_by_name,
        isWalkIn: row.is_walk_in,
      }));

      dispatch({ type: 'SET_ORDERS', orders });
    } catch (error: any) {
      console.error('Error fetching orders:', error.message);
    }
  };

  const placeOrderToSupabase = async (order: Order) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          customer_id: order.customerId,
          customer_name: order.customerName,
          customer_email: order.customerEmail,
          items: order.items,
          total_amount: order.totalAmount,
          status: order.status,
          payment_type: order.paymentType,
          placed_by: order.placedBy,
          placed_by_name: order.placedByName,
          is_walk_in: order.isWalkIn,
        })
        .select()
        .single();

      if (error) throw error;

      const newOrder: Order = {
        id: data.id,
        customerId: data.customer_id,
        customerName: data.customer_name,
        customerEmail: data.customer_email,
        items: data.items,
        totalAmount: parseFloat(data.total_amount),
        status: data.status,
        paymentType: data.payment_type,
        createdAt: data.created_at,
        placedBy: data.placed_by,
        placedByName: data.placed_by_name,
        isWalkIn: data.is_walk_in,
      };

      dispatch({ type: 'ADD_ORDER', order: newOrder });
    } catch (error: any) {
      console.error('Error placing order:', error.message);
      throw error;
    }
  };

  const updateOrderStatusInSupabase = async (orderId: string, status: 'approved' | 'rejected') => {
    try {
      console.log(`📝 Updating order ${orderId} status to ${status}`);

      const updateData: any = {
        status,
        [status === 'approved' ? 'approved_at' : 'rejected_at']: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      if (status === 'approved') {
        const order = state.orders.find(o => o.id === orderId);
        if (order) {
          // Update dish stock
          for (const item of order.items) {
            const dish = state.dishes.find(d => d.id === item.dish.id);

            if (dish && dish.stockQuantity !== null && dish.stockQuantity !== undefined) {
              const newStock = Math.max(0, dish.stockQuantity - item.quantity);

              await supabase
                .from('dishes')
                .update({
                  stock_quantity: newStock,
                  available: newStock > 0,
                })
                .eq('id', item.dish.id);
            }
          }

          // Update customer balance for monthly orders
          if (order.paymentType === 'monthly') {
            const customer = state.customers.find(c => c.id === order.customerId);
            if (customer) {
              const newMonthlyBalance = customer.monthlyBalance + order.totalAmount;
              const newTotalSpent = customer.totalSpent + order.totalAmount;

              console.log(`💰 Updating customer balance:`, {
                customer: customer.name,
                oldBalance: customer.monthlyBalance,
                orderAmount: order.totalAmount,
                newBalance: newMonthlyBalance,
                totalSpent: newTotalSpent
              });

              await updateCustomerInSupabase(customer.id, {
                monthlyBalance: newMonthlyBalance,
                totalSpent: newTotalSpent,
              });
            }
          }
        }
      }

      dispatch({ type: 'UPDATE_ORDER_STATUS', orderId, status });
      await fetchDishesFromSupabase();

    } catch (error: any) {
      console.error('Error updating order status:', error.message);
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
        fetchDishesFromSupabase,
        addDishToSupabase,
        updateDishInSupabase,
        deleteDishFromSupabase,
        fetchOrdersFromSupabase,
        placeOrderToSupabase,
        updateOrderStatusInSupabase,
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
