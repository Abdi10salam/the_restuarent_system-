// context/AuthContext.tsx - UPDATED SECTIONS
// Add these changes to your existing AuthContext file

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';
import { AuthState, Customer, UserRole } from '../types';

// 🆕 UPDATED: AuthAction to support receptionist
type AuthAction =
  | { type: 'LOGIN'; userType: 'customer' | 'admin' | 'receptionist'; user: Customer }  // Added receptionist
  | { type: 'LOGOUT' }
  | { type: 'SET_PASSWORD'; customerId: string; password: string }
  | { type: 'SET_PENDING_EMAIL'; email: string }
  | { type: 'CLEAR_PENDING_EMAIL' };

// 🆕 UPDATED: ExtendedAuthState
interface ExtendedAuthState extends AuthState {
  pendingEmail?: string;
}

const initialState: ExtendedAuthState = {
  isAuthenticated: false,
  userType: null,
  currentUser: null,
  pendingEmail: undefined,
};

// Mock admin user (existing - no changes)
const mockAdmin: Customer = {
  id: 'admin-1',
  name: 'Restaurant Manager',
  email: 'admin@test.com',
  customerNumber: 1,
  role: 'admin',
  paymentType: 'cash',
  monthlyBalance: 0,
  totalSpent: 0,
  isFirstLogin: false,
  password: 'admin',
  registeredAt: '2024-01-01T00:00:00Z'
};

// 🆕 UPDATED: authReducer - Support receptionist
function authReducer(state: ExtendedAuthState, action: AuthAction): ExtendedAuthState {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        isAuthenticated: true,
        userType: action.userType,  // Can now be 'receptionist'
        currentUser: action.user,
        pendingEmail: undefined,
      };
    case 'LOGOUT':
      return initialState;
    case 'SET_PASSWORD':
      if (state.currentUser && state.currentUser.id === action.customerId) {
        return {
          ...state,
          currentUser: {
            ...state.currentUser,
            password: action.password,
            isFirstLogin: false,
          },
        };
      }
      return state;
    case 'SET_PENDING_EMAIL':
      return {
        ...state,
        pendingEmail: action.email,
      };
    case 'CLEAR_PENDING_EMAIL':
      return {
        ...state,
        pendingEmail: undefined,
      };
    default:
      return state;
  }
}

// 🆕 UPDATED: AuthContext type
const AuthContext = createContext<{
  state: ExtendedAuthState;
  dispatch: React.Dispatch<AuthAction>;
  login: (userType: 'customer' | 'admin' | 'receptionist', email: string, password?: string) => Promise<{ success: boolean; requiresPasswordSetup?: boolean; customer?: Customer; error?: string }>;
  logout: () => void;
  setPassword: (customerId: string, password: string) => void;
  setPendingEmail: (email: string) => void;
  clearPendingEmail: () => void;
} | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 🆕 UPDATED: login function - Support receptionist
  const login = async (userType: 'customer' | 'admin' | 'receptionist', email: string, password?: string) => {
    // Admin login (existing - no changes)
    if (userType === 'admin' && email === 'admin@test.com' && password === 'admin') {
      dispatch({ type: 'LOGIN', userType: 'admin', user: mockAdmin });
      return { success: true };
    }

    // 🆕 Receptionist login handled in login.tsx
    // Customer login handled in verify-otp.tsx
    return { success: false, error: 'Invalid credentials' };
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const setPassword = (customerId: string, password: string) => {
    dispatch({ type: 'SET_PASSWORD', customerId, password });
  };

  const setPendingEmail = (email: string) => {
    dispatch({ type: 'SET_PENDING_EMAIL', email });
  };

  const clearPendingEmail = () => {
    dispatch({ type: 'CLEAR_PENDING_EMAIL' });
  };

  return (
    <AuthContext.Provider value={{
      state,
      dispatch,
      login,
      logout,
      setPassword,
      setPendingEmail,
      clearPendingEmail
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}