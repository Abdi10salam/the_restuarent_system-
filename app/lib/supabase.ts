import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebpvzazwggmavbvmpatg.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVicHZ6YXp3Z2dtYXZidm1wYXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMTQ4OTIsImV4cCI6MjA3NTc5MDg5Mn0.I1IiGoztOdBs0qPWEJXeD058x1EY-KFZzWK-r-iRHY0'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface DatabaseCustomer {
  id: string;
  clerk_user_id: string | null;
  name: string;
  email: string;
  payment_type: 'cash' | 'monthly';
  monthly_balance: number;
  total_spent: number;
  is_first_login: boolean;
  created_by_admin_email: string;
  registered_at: string;
  updated_at: string;
}