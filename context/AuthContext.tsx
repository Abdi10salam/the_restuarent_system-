import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';
import { AuthState, Customer } from '../types';

type AuthAction =
  | { type: 'LOGIN'; userType: 'customer' | 'admin'; user: Customer }
  | { type: 'LOGOUT' }
  | { type: 'SET_PASSWORD'; customerId: string; password: string }
  | { type: 'SET_PENDING_EMAIL'; email: string }
  | { type: 'CLEAR_PENDING_EMAIL' };

interface ExtendedAuthState extends AuthState {
  pendingEmail?: string;
}

const initialState: ExtendedAuthState = {
  isAuthenticated: false,
  userType: null,
  currentUser: null,
  pendingEmail: undefined,
};

// Mock admin user
const mockAdmin: Customer = {
  id: 'admin-1',
  name: 'Restaurant Manager',
  email: 'admin@test.com',
  paymentType: 'cash',
  monthlyBalance: 0,
  totalSpent: 0,
  isFirstLogin: false,
  password: 'admin',
  registeredAt: '2024-01-01T00:00:00Z'
};

function authReducer(state: ExtendedAuthState, action: AuthAction): ExtendedAuthState {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        isAuthenticated: true,
        userType: action.userType,
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

const AuthContext = createContext<{
  state: ExtendedAuthState;
  dispatch: React.Dispatch<AuthAction>;
  login: (userType: 'customer' | 'admin', email: string, password?: string) => Promise<{ success: boolean; requiresPasswordSetup?: boolean; customer?: Customer; error?: string }>;
  logout: () => void;
  setPassword: (customerId: string, password: string) => void;
  setPendingEmail: (email: string) => void;
  clearPendingEmail: () => void;
} | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (userType: 'customer' | 'admin', email: string, password?: string) => {
    // Admin login (no Clerk)
    if (userType === 'admin' && email === 'admin@test.com' && password === 'admin') {
      dispatch({ type: 'LOGIN', userType: 'admin', user: mockAdmin });
      return { success: true };
    }

    // Customer login is handled through Clerk in the verify-otp screen
    // This is just a fallback
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