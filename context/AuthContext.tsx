// context/AuthContext.tsx - UPDATED VERSION

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';
import { AuthState, Customer, UserRole } from '../types';

type AuthAction =
  | { type: 'LOGIN'; userType: 'customer' | 'admin' | 'receptionist'; user: Customer }
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

// ❌ REMOVED: Mock admin - no longer needed

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
  login: (userType: 'customer' | 'admin' | 'receptionist', email: string, password?: string) => Promise<{ success: boolean; requiresPasswordSetup?: boolean; customer?: Customer; error?: string }>;
  logout: () => void;
  setPassword: (customerId: string, password: string) => void;
  setPendingEmail: (email: string) => void;
  clearPendingEmail: () => void;
} | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ✅ UPDATED: No more mock admin login
  const login = async (userType: 'customer' | 'admin' | 'receptionist', email: string, password?: string) => {
    // All authentication is now handled in login.tsx and verify-otp.tsx
    // This function is kept for backward compatibility
    return { success: false, error: 'Use login screen for authentication' };
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