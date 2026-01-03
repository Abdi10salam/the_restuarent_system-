// lib/customer-helpers.ts - Customer management helpers

import { supabase } from '../../app/lib/supabase';
import { Customer } from '../../types';

/**
 * Generate next available customer number
 * Returns the next sequential number (e.g., if last is 15, returns 16)
 */
export async function generateCustomerNumber(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('customer_number')
      .order('customer_number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching last customer number:', error);
      // Fallback: start from 10 if error
      return 10;
    }

    // If no customers exist, start from 10
    if (!data || data.length === 0) {
      return 10;
    }

    // Return next number
    const lastNumber = data[0].customer_number || 9;
    return lastNumber + 1;
  } catch (error) {
    console.error('Error generating customer number:', error);
    return 10; // Fallback
  }
}

/**
 * Search customer by customer number
 * @param customerNumber - The customer number to search for (e.g., 42)
 */
export async function searchCustomerByNumber(
  customerNumber: number
): Promise<Customer | null> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('customer_number', customerNumber)
      .single();

    if (error) {
      console.error('Error searching customer:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    // Map database fields to Customer interface
    const customer: Customer = {
      id: data.id,
      name: data.name,
      email: data.email,
      customerNumber: data.customer_number,
      role: data.role || 'customer',
      paymentType: data.payment_type,
      monthlyBalance: parseFloat(data.monthly_balance) || 0,
      totalSpent: parseFloat(data.total_spent) || 0,
      isFirstLogin: data.is_first_login,
      registeredAt: data.registered_at,
    };

    return customer;
  } catch (error) {
    console.error('Error searching customer by number:', error);
    return null;
  }
}

/**
 * Search customers by name or email (for receptionist search with autocomplete)
 * @param searchTerm - Name or email to search
 */
export async function searchCustomers(searchTerm: string): Promise<Customer[]> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('customer_number', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Error searching customers:', error);
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      customerNumber: row.customer_number,
      role: row.role || 'customer',
      paymentType: row.payment_type,
      monthlyBalance: parseFloat(row.monthly_balance) || 0,
      totalSpent: parseFloat(row.total_spent) || 0,
      isFirstLogin: row.is_first_login,
      registeredAt: row.registered_at,
    }));
  } catch (error) {
    console.error('Error searching customers:', error);
    return [];
  }
}

/**
 * Format customer number for display
 * @param customerNumber - The number to format
 * @returns Formatted string (e.g., "Customer #42")
 */
// In customer-helpers.ts
export function formatCustomerNumber(customerNumber: number): string {
  if (customerNumber === -1) return '#WALK-IN';
  return `#${customerNumber}`;
}

/**
 * Validate customer number input
 * @param input - The input string to validate
 * @returns True if valid number
 */
export function isValidCustomerNumber(input: string): boolean {
  const number = parseInt(input);
  return !isNaN(number) && number > 0 && number < 10000;
}

/**
 * Get customer display name with number
 * @param customer - Customer object
 * @returns Formatted name (e.g., "John Doe (#42)")
 */
export function getCustomerDisplayName(customer: Customer): string {
  return `${customer.name} (${formatCustomerNumber(customer.customerNumber)})`;
}