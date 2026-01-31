// utils/payment-calculations.ts - COMPLETE FIX WITH DEBUGGING
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
 * REVENUE CALCULATION - COMPLETELY FIXED
 *
 * Walk-in Revenue: Cash orders approved this month (immediate payment)
 * Monthly Payments: Amount PAID by monthly customers (totalSpent - monthlyBalance)
 */
export interface RevenueCalculation {
  totalRevenue: number;
  walkInRevenue: number;
  monthlyPaymentsRevenue: number;
  revenueOrders: Order[];
}

export function calculateRevenue(orders: Order[], customers: Customer[]): RevenueCalculation {
  const { startDate, endDate } = getCurrentMonthRange();

  console.log('═══════════════════════════════════');
  console.log('💰 REVENUE CALCULATION');
  console.log('Period:', startDate.toLocaleDateString(), 'to', endDate.toLocaleDateString());
  console.log('Total orders:', orders.length);
  console.log('Total customers:', customers.length);
  console.log('═══════════════════════════════════');

  // ✅ WALK-IN REVENUE: Cash orders approved this month
  const walkInOrders = orders.filter(order => {
    if (order.status !== 'approved') return false;
    if (order.paymentType !== 'cash') return false;

    // Use approvedAt if exists, otherwise createdAt
    const revenueDate = order.approvedAt ? new Date(order.approvedAt) : new Date(order.createdAt);
    const isInRange = revenueDate >= startDate && revenueDate <= endDate;

    if (order.paymentType === 'cash' && order.status === 'approved') {
      console.log(`  ${isInRange ? '✅' : '❌'} Order #${order.id.slice(-6)}: USh ${order.totalAmount} on ${revenueDate.toLocaleDateString()}`);
    }

    return isInRange;
  });

  const walkInRevenue = walkInOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  console.log('───────────────────────────────────');
  console.log('💵 WALK-IN REVENUE:');
  console.log('  Orders:', walkInOrders.length);
  console.log('  Total: USh', walkInRevenue);
  console.log('───────────────────────────────────');

  // ✅ MONTHLY PAYMENTS REVENUE: Payments received from monthly customers
  // Logic: totalSpent - monthlyBalance = amount they've paid
  let monthlyPaymentsRevenue = 0;

  const monthlyCustomers = customers.filter(c => c.paymentType === 'monthly');

  console.log('💳 MONTHLY PAYMENTS REVENUE:');
  console.log('  Monthly customers:', monthlyCustomers.length);

  monthlyCustomers.forEach(customer => {
    const totalPaid = customer.totalSpent - customer.monthlyBalance;

    if (customer.totalSpent > 0) {
      console.log(`  Customer: ${customer.name}`);
      console.log(`    Total Spent: USh ${customer.totalSpent}`);
      console.log(`    Balance Owed: USh ${customer.monthlyBalance}`);
      console.log(`    Amount Paid: USh ${totalPaid}`);

      if (totalPaid > 0) {
        monthlyPaymentsRevenue += totalPaid;
      }
    }
  });

  console.log('───────────────────────────────────');
  console.log('💳 Total Monthly Payments: USh', monthlyPaymentsRevenue);
  console.log('═══════════════════════════════════');
  console.log('💰 TOTAL REVENUE: USh', walkInRevenue + monthlyPaymentsRevenue);
  console.log('═══════════════════════════════════\n');

  return {
    totalRevenue: walkInRevenue + monthlyPaymentsRevenue,
    walkInRevenue,
    monthlyPaymentsRevenue,
    revenueOrders: walkInOrders,
  };
}

/**
 * MONTHLY BILLS CALCULATION - FIXED
 * Shows ONLY monthly payment customers with unpaid balances
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
  console.log('═══════════════════════════════════');
  console.log('📋 MONTHLY BILLS CALCULATION');
  console.log('═══════════════════════════════════');

  // ✅ ONLY monthly payment customers with balance > 0
  const customersWithBalance = customers.filter(c => {
    const hasBalance = c.paymentType === 'monthly' && c.monthlyBalance > 0;

    if (c.paymentType === 'monthly') {
      console.log(`  ${hasBalance ? '✅' : '❌'} ${c.name}: Balance=USh ${c.monthlyBalance}`);
    }

    return hasBalance;
  });

  const customersWithBills = customersWithBalance.map(customer => {
    // Get their orders
    const customerOrders = orders.filter(order =>
      order.customerId === customer.id &&
      order.status === 'approved' &&
      order.paymentType === 'monthly'
    );

    return {
      customer,
      unpaidAmount: customer.monthlyBalance,
      orders: customerOrders,
    };
  });

  const totalMonthlyBills = customersWithBills.reduce((sum, c) => sum + c.unpaidAmount, 0);

  console.log('───────────────────────────────────');
  console.log('📋 Total Monthly Bills: USh', totalMonthlyBills);
  console.log('📋 Customers with bills:', customersWithBills.length);
  console.log('═══════════════════════════════════\n');

  return {
    totalMonthlyBills,
    customersWithBills,
    totalCustomers: customersWithBills.length,
  };
}

/**
 * OVERDUE BILLS CALCULATION - FIXED
 * Shows customers with unpaid balances from old orders
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
  const { startDate: currentMonthStart } = getCurrentMonthRange();

  console.log('═══════════════════════════════════');
  console.log('⚠️  OVERDUE BILLS CALCULATION');
  console.log('Current month starts:', currentMonthStart.toLocaleDateString());
  console.log('═══════════════════════════════════');

  // ✅ FIXED: Only show customers with orders from PREVIOUS months
  const customersWithBalance = customers.filter(c =>
    c.paymentType === 'monthly' &&
    c.monthlyBalance > 0
  );

  const customersWithOverdue = customersWithBalance
    .map(customer => {
      // Get all their approved monthly orders from BEFORE current month
      const oldOrders = orders.filter(order =>
        order.customerId === customer.id &&
        order.status === 'approved' &&
        order.paymentType === 'monthly' &&
        new Date(order.createdAt) < currentMonthStart // ← ONLY old orders
      );

      // If they have no old orders, they're not overdue (just this month's bill)
      if (oldOrders.length === 0) {
        return null;
      }

      // Find oldest order
      const sortedOrders = oldOrders.sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      const oldestOrderDate = new Date(sortedOrders[0].createdAt);

      // Calculate days overdue from oldest order
      const now = new Date();
      const daysOverdue = Math.floor((now.getTime() - oldestOrderDate.getTime()) / (1000 * 60 * 60 * 24));

      console.log(`  ⚠️  ${customer.name}: USh ${customer.monthlyBalance} (${daysOverdue} days overdue) - Oldest order: ${oldestOrderDate.toLocaleDateString()}`);

      return {
        customer,
        overdueAmount: customer.monthlyBalance,
        orders: oldOrders,
        oldestOrderDate,
        daysOverdue,
      };
    })
    .filter(item => item !== null) as Array<{
    customer: Customer;
    overdueAmount: number;
    orders: Order[];
    oldestOrderDate: Date;
    daysOverdue: number;
  }>;

  // Sort by days overdue (most urgent first)
  customersWithOverdue.sort((a, b) => b.daysOverdue - a.daysOverdue);

  const totalOverdueBills = customersWithOverdue.reduce((sum, c) => sum + c.overdueAmount, 0);

  console.log('───────────────────────────────────');
  console.log('⚠️  Total Overdue: USh', totalOverdueBills);
  console.log('⚠️  Customers:', customersWithOverdue.length);
  console.log('═══════════════════════════════════\n');

  return {
    totalOverdueBills,
    customersWithOverdue,
    totalCustomers: customersWithOverdue.length,
  };
}

/**
 * COMPLETED ORDERS COUNT - Count approved orders this month
 */
export function getCompletedOrdersCount(orders: Order[]): number {
  const { startDate, endDate } = getCurrentMonthRange();

  const completedOrders = orders.filter(order => {
    if (order.status !== 'approved') return false;

    const orderDate = order.approvedAt ? new Date(order.approvedAt) : new Date(order.createdAt);
    return orderDate >= startDate && orderDate <= endDate;
  });

  return completedOrders.length;
}

/**
 * ACTIVE CUSTOMERS COUNT - Unique customers who ordered this month
 */
export function getActiveCustomersCount(orders: Order[]): number {
  const { startDate, endDate } = getCurrentMonthRange();

  const activeCustomerIds = new Set<string>();

  orders.forEach(order => {
    if (order.status !== 'approved') return;

    const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
    if (orderDate >= startDate && orderDate <= endDate) {
      activeCustomerIds.add(order.customerId);
    }
  });

  return activeCustomerIds.size;
}

/**
 * SEVERITY CALCULATION for overdue bills
 */
export function getOverdueSeverity(daysOverdue: number): 'low' | 'medium' | 'high' | 'critical' {
  if (daysOverdue >= 90) return 'critical';
  if (daysOverdue >= 60) return 'high';
  if (daysOverdue >= 30) return 'medium';
  return 'low';
}

export function getOverdueSeverityColor(severity: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (severity) {
    case 'critical': return '#DC2626';
    case 'high': return '#EF4444';
    case 'medium': return '#F97316';
    case 'low': return '#F59E0B';
  }
}

export function formatDaysOverdue(days: number): string {
  if (days === 0) return 'Due today';
  if (days === 1) return '1 day overdue';
  if (days < 30) return `${days} days overdue`;

  const months = Math.floor(days / 30);
  if (months === 1) return '1 month overdue';
  return `${months} months overdue`;
}