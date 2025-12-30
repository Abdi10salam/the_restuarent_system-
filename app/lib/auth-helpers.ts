// lib/auth-helpers.ts - Role-based access control helpers

import { UserRole, Permission, hasPermission } from '../../types';

/**
 * Get the portal route based on user role
 */
export function getPortalForRole(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/(admin)';
    case 'receptionist':
      return '/(tabs)/reception-dashboard';
    case 'customer':
    default:
      return '/(tabs)';
  }
}

/**
 * Check if user can access a specific feature
 */
export function canAccess(role: UserRole, permission: Permission): boolean {
  return hasPermission(role, permission);
}

/**
 * Check if user is receptionist or admin
 */
export function canApproveOrders(role: UserRole): boolean {
  return role === 'receptionist' || role === 'admin';
}

/**
 * Check if user can search for customers
 */
export function canSearchCustomers(role: UserRole): boolean {
  return role === 'receptionist' || role === 'admin';
}

/**
 * Check if user can place orders on behalf of others
 */
export function canPlaceOrderForOthers(role: UserRole): boolean {
  return role === 'receptionist' || role === 'admin';
}

/**
 * Check if user can manage dishes (add/edit/delete)
 */
export function canManageDishes(role: UserRole): boolean {
  return role === 'admin';
}

/**
 * Check if user can manage customers (add/edit)
 */
export function canManageCustomers(role: UserRole): boolean {
  return role === 'admin';
}

/**
 * Check if user can view analytics
 */
export function canViewAnalytics(role: UserRole): boolean {
  return role === 'admin';
}

/**
 * Check if user can print receipts
 */
export function canPrintReceipts(role: UserRole): boolean {
  return role === 'receptionist' || role === 'admin';
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'receptionist':
      return 'Receptionist';
    case 'customer':
      return 'Customer';
    default:
      return 'Unknown';
  }
}

/**
 * Get role badge color
 */
export function getRoleBadgeColor(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '#EF4444'; // Red
    case 'receptionist':
      return '#10B981'; // Green
    case 'customer':
      return '#3B82F6'; // Blue
    default:
      return '#6B7280'; // Gray
  }
}

/**
 * Check if order should be auto-approved (walk-in orders)
 */
export function shouldAutoApproveOrder(isWalkIn: boolean, userRole: UserRole): boolean {
  return isWalkIn && (userRole === 'receptionist' || userRole === 'admin');
}

/**
 * Generate walk-in customer name with timestamp
 */
export function generateWalkInCustomerName(): string {
  const timestamp = Date.now().toString().slice(-4);
  return `Walk-in #${timestamp}`;
}

/**
 * Check if customer is a walk-in customer
 */
export function isWalkInCustomer(customerId: string): boolean {
  return customerId === 'walk-in';
}