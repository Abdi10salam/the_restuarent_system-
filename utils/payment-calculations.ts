// utils/payment-calculations.ts
// Core business logic for revenue, bills, and payments

import { Order, Customer } from '../types';

/**
 * Get the start and end dates for the current month
 */
export function getCurrentMonthRange(): { startDate: Date; endDate: Date } {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
}

/**
 * Get date range for a specific month
 */
export function getMonthRange(year: number, month: number): { startDate: Date; endDate: Date } {
  const startDate = new Date(year, month, 1);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(year, month + 1, 0);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
}

/**
 * Check if a date is in the current month
 */
export function isInCurrentMonth(date: Date | string): boolean {
  const { startDate, endDate } = getCurrentMonthRange();
  const checkDate = new Date(date);
  return checkDate >= startDate && checkDate <= endDate;
}

/**
 * Check if a date is before the current month (overdue)
 */
export function isBeforeCurrentMonth(date: Date | string): boolean {
  const { startDate } = getCurrentMonthRange();
  const checkDate = new Date(date);
  return checkDate < startDate;
}

/**
 * REVENUE CALCULATION
 * Revenue = Money actually received (payment date matters, not order date)
 *
 * Components:
 * 1. Walk-in cash payments (immediate)
 * 2. Monthly bill payments (when customer actually pays)
 */
export interface RevenueCalculation {
  totalRevenue: number;
  walkInRevenue: number;
  monthlyPaymentsRevenue: number;
  revenueOrders: Order[];
}

export function calculateRevenue(orders: Order[], customers: Customer[]): RevenueCalculation {
  const { startDate, endDate } = getCurrentMonthRange();

  // Walk-in revenue: cash orders approved this month
  const walkInOrders = orders.filter(order => {
    const approvedDate = order.approvedAt ? new Date(order.approvedAt) : null;
    return (
      order.status === 'approved' &&
      order.paymentType === 'cash' &&
      approvedDate &&
      approvedDate >= startDate &&
      approvedDate <= endDate
    );
  });

  const walkInRevenue = walkInOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  // Monthly payments revenue: would need a payments table
  // For now, we'll track this as zero until payments table is implemented
  const monthlyPaymentsRevenue = 0;

  // TODO: When payments table exists:
  // const monthlyPayments = payments.filter(p =>
  //   p.payment_date >= startDate && p.payment_date <= endDate
  // );
  // const monthlyPaymentsRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

  return {
    totalRevenue: walkInRevenue + monthlyPaymentsRevenue,
    walkInRevenue,
    monthlyPaymentsRevenue,
    revenueOrders: walkInOrders,
  };
}

/**
 * MONTHLY BILLS CALCULATION
 * Monthly Bills = Unpaid balances for orders created in CURRENT month
 * (Order creation date matters)
 */
export interface MonthlyBillsCalculation {
  totalMonthlyBills: number;
  customersWithBills: Array<{
    customer: Customer;
    unpaidAmount: number;
    orders: Order[];
  }>;
  totalCustomers: number;
}

export function calculateMonthlyBills(orders: Order[], customers: Customer[]): MonthlyBillsCalculation {
  const { startDate, endDate } = getCurrentMonthRange();

  // Get monthly orders created this month that are approved but unpaid
  const monthlyOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return (
      order.status === 'approved' &&
      order.paymentType === 'monthly' &&
      orderDate >= startDate &&
      orderDate <= endDate
    );
  });

  // Group by customer
  const customerBillsMap = new Map<string, { customer: Customer; orders: Order[]; total: number }>();

  monthlyOrders.forEach(order => {
    const customer = customers.find(c => c.id === order.customerId);
    if (!customer) return;

    if (!customerBillsMap.has(customer.id)) {
      customerBillsMap.set(customer.id, {
        customer,
        orders: [],
        total: 0,
      });
    }

    const billData = customerBillsMap.get(customer.id)!;
    billData.orders.push(order);
    billData.total += order.totalAmount;
  });

  const customersWithBills = Array.from(customerBillsMap.values()).map(data => ({
    customer: data.customer,
    unpaidAmount: data.total,
    orders: data.orders,
  }));

  const totalMonthlyBills = customersWithBills.reduce((sum, c) => sum + c.unpaidAmount, 0);

  return {
    totalMonthlyBills,
    customersWithBills,
    totalCustomers: customersWithBills.length,
  };
}

/**
 * OVERDUE BILLS CALCULATION
 * Overdue Bills = Unpaid balances from PREVIOUS months
 * (Orders created before current month)
 */
export interface OverdueBillsCalculation {
  totalOverdueBills: number;
  customersWithOverdue: Array<{
    customer: Customer;
    overdueAmount: number;
    orders: Order[];
    oldestOrderDate: Date;
    daysOverdue: number;
  }>;
  totalCustomers: number;
}

export function calculateOverdueBills(orders: Order[], customers: Customer[]): OverdueBillsCalculation {
  const { startDate } = getCurrentMonthRange();

  // Get monthly orders created BEFORE current month that are approved but unpaid
  const overdueOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return (
      order.status === 'approved' &&
      order.paymentType === 'monthly' &&
      orderDate < startDate
    );
  });

  // Group by customer
  const customerOverdueMap = new Map<string, { customer: Customer; orders: Order[]; total: number }>();

  overdueOrders.forEach(order => {
    const customer = customers.find(c => c.id === order.customerId);
    if (!customer) return;

    if (!customerOverdueMap.has(customer.id)) {
      customerOverdueMap.set(customer.id, {
        customer,
        orders: [],
        total: 0,
      });
    }

    const overdueData = customerOverdueMap.get(customer.id)!;
    overdueData.orders.push(order);
    overdueData.total += order.totalAmount;
  });

  const customersWithOverdue = Array.from(customerOverdueMap.values()).map(data => {
    // Find oldest order
    const sortedOrders = data.orders.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const oldestOrderDate = new Date(sortedOrders[0].createdAt);

    // Calculate days overdue
    const now = new Date();
    const daysOverdue = Math.floor((now.getTime() - oldestOrderDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      customer: data.customer,
      overdueAmount: data.total,
      orders: data.orders,
      oldestOrderDate,
      daysOverdue,
    };
  });

  // Sort by days overdue (most urgent first)
  customersWithOverdue.sort((a, b) => b.daysOverdue - a.daysOverdue);

  const totalOverdueBills = customersWithOverdue.reduce((sum, c) => sum + c.overdueAmount, 0);

  return {
    totalOverdueBills,
    customersWithOverdue,
    totalCustomers: customersWithOverdue.length,
  };
}

/**
 * COMPLETED ORDERS COUNT
 * Count of approved orders in current month
 */
export function getCompletedOrdersCount(orders: Order[]): number {
  const { startDate, endDate } = getCurrentMonthRange();

  return orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return (
      order.status === 'approved' &&
      orderDate >= startDate &&
      orderDate <= endDate
    );
  }).length;
}

/**
 * ACTIVE CUSTOMERS COUNT
 * Unique customers who ordered in current month
 */
export function getActiveCustomersCount(orders: Order[]): number {
  const { startDate, endDate } = getCurrentMonthRange();

  const activeCustomerIds = new Set<string>();

  orders.forEach(order => {
    const orderDate = new Date(order.createdAt);
    if (orderDate >= startDate && orderDate <= endDate) {
      activeCustomerIds.add(order.customerId);
    }
  });

  return activeCustomerIds.size;
}

/**
 * Get severity level for overdue bills
 */
export function getOverdueSeverity(daysOverdue: number): 'low' | 'medium' | 'high' | 'critical' {
  if (daysOverdue < 30) return 'low';
  if (daysOverdue < 60) return 'medium';
  if (daysOverdue < 90) return 'high';
  return 'critical';
}

/**
 * Get color for overdue severity
 */
export function getOverdueSeverityColor(severity: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (severity) {
    case 'low': return '#F59E0B'; // Orange
    case 'medium': return '#F97316'; // Deep orange
    case 'high': return '#EF4444'; // Red
    case 'critical': return '#DC2626'; // Dark red
    default: return '#6B7280'; // Gray
  }
}

/**
 * Format days overdue as human-readable text
 */
export function formatDaysOverdue(days: number): string {
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''}`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks !== 1 ? 's' : ''}`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} month${months !== 1 ? 's' : ''}`;
  }
  const years = Math.floor(days / 365);
  return `${years} year${years !== 1 ? 's' : ''}`;
}