// app/lib/walkin-customer.ts
import { supabase } from './supabase';

export const WALK_IN_CUSTOMER_ID = '00000000-0000-0000-0000-000000000001';
export const WALK_IN_CUSTOMER_NUMBER = -1;

/**
 * Ensures the walk-in customer exists in the database
 * Creates it if it doesn't exist
 * This should be called when the app starts or before placing a walk-in order
 */
export async function ensureWalkInCustomerExists(): Promise<boolean> {
  try {
    console.log('🔍 Checking if walk-in customer exists...');
    
    // Check if walk-in customer already exists
    const { data: existing, error: checkError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', WALK_IN_CUSTOMER_ID)
      .single();

    if (existing) {
      console.log('✅ Walk-in customer already exists');
      return true;
    }

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected
      console.error('❌ Error checking walk-in customer:', checkError);
      return false;
    }

    // Walk-in customer doesn't exist, create it
    console.log('📝 Creating walk-in customer...');
    
    const { data, error: insertError } = await supabase
      .from('customers')
      .insert({
        id: WALK_IN_CUSTOMER_ID,
        clerk_user_id: 'walk-in-clerk-id',
        name: 'Walk-in Customer',
        email: 'walk-in@restaurant.local',
        customer_number: WALK_IN_CUSTOMER_NUMBER,
        role: 'customer',
        payment_type: 'cash',
        monthly_balance: 0,
        total_spent: 0,
        is_first_login: false,
        created_by_admin_email: 'system@restaurant.local',
        registered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to create walk-in customer:', insertError);
      return false;
    }

    console.log('✅ Walk-in customer created successfully');
    return true;
  } catch (error) {
    console.error('❌ Unexpected error in ensureWalkInCustomerExists:', error);
    return false;
  }
}

/**
 * Get the walk-in customer ID (ensures it exists first)
 */
export async function getWalkInCustomerId(): Promise<string | null> {
  const exists = await ensureWalkInCustomerExists();
  return exists ? WALK_IN_CUSTOMER_ID : null;
}