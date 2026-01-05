import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebpvzazwggmavbvmpatg.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVicHZ6YXp3Z2dtYXZidm1wYXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMTQ4OTIsImV4cCI6MjA3NTc5MDg5Mn0.I1IiGoztOdBs0qPWEJXeD058x1EY-KFZzWK-r-iRHY0'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface DatabaseCustomer {
  id: string
  clerk_user_id: string | null
  name: string
  email: string
  payment_type: "cash" | "monthly"
  monthly_balance: number
  total_spent: number
  is_first_login: boolean
  created_by_admin_email: string
  registered_at: string
  updated_at: string
}

export interface DatabaseDish {
  id: string
  name: string
  description: string
  price: number
  category: string
  image: string
  available: boolean
  created_by_admin_email: string
  created_at: string
  updated_at: string
}

export interface DatabaseOrder {
  id: string
  customer_id: string
  customer_name: string
  customer_email: string
  items: any // JSONB
  total_amount: number
  status: "pending" | "approved" | "rejected"
  payment_type: "cash" | "monthly"
  created_at: string
  approved_at: string | null
  rejected_at: string | null
}
// Helper function to upload image to Supabase Storage
export async function uploadDishImage(uri: string, dishName: string): Promise<string | null> {
  try {
    console.log('Starting upload...');
    console.log('URI:', uri);
    
    // Create a unique filename
    const fileExt = uri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}_${dishName.replace(/\s+/g, '_')}.${fileExt}`;
    const filePath = fileName;

    console.log('Uploading as:', filePath);

    // For React Native, we need to read the file as ArrayBuffer
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    
    console.log('File size:', arrayBuffer.byteLength, 'bytes');
    
    // Check if file is valid
    if (arrayBuffer.byteLength < 1000) {
      console.error('File size too small');
      throw new Error('Failed to read image file');
    }

    // Upload the ArrayBuffer
    const { data, error } = await supabase.storage
      .from('dish-images')
      .upload(filePath, arrayBuffer, {
        contentType: `image/${fileExt}`,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    console.log('Upload successful! Path:', data.path);

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('dish-images')
      .getPublicUrl(data.path);

    const publicUrl = publicUrlData.publicUrl;
    console.log('Public URL:', publicUrl);

    return publicUrl;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    console.error('Error details:', error.message);
    return null;
  }
}
// Helper function to delete image from Supabase Storage
export async function deleteDishImage(imageUrl: string): Promise<boolean> {
  try {
    // Extract filename from URL
    const urlParts = imageUrl.split("/")
    const fileName = urlParts[urlParts.length - 1]

    const { error } = await supabase.storage.from("dish-images").remove([fileName])

    if (error) {
      console.error("Delete error:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error deleting image:", error)
    return false
  }
}

// Upload profile image - SAME PATTERN as uploadDishImage
export async function uploadProfileImage(uri: string, userName: string): Promise<string | null> {
  try {
    console.log('Starting profile upload...');
    console.log('URI:', uri);
    
    // Create a unique filename (same pattern as dishes)
    const fileExt = uri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const fileName = `profile_${Date.now()}_${userName.replace(/\s+/g, '_')}.${fileExt}`;
    const filePath = fileName;

    console.log('Uploading as:', filePath);

    // For React Native, we need to read the file as ArrayBuffer (SAME as dishes)
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    
    console.log('File size:', arrayBuffer.byteLength, 'bytes');
    
    // Check if file is valid (SAME as dishes)
    if (arrayBuffer.byteLength < 1000) {
      console.error('File size too small');
      throw new Error('Failed to read image file');
    }

    // Upload the ArrayBuffer to SAME BUCKET as dishes
    const { data, error } = await supabase.storage
      .from('dish-images')  // ✅ SAME BUCKET as dishes!
      .upload(filePath, arrayBuffer, {
        contentType: `image/${fileExt}`,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    console.log('Upload successful! Path:', data.path);

    // Get public URL from SAME BUCKET
    const { data: publicUrlData } = supabase.storage
      .from('dish-images')  // ✅ SAME BUCKET as dishes!
      .getPublicUrl(data.path);

    const publicUrl = publicUrlData.publicUrl;
    console.log('Public URL:', publicUrl);

    return publicUrl;
  } catch (error: any) {
    console.error('Error uploading profile image:', error);
    console.error('Error details:', error.message);
    return null;
  }
}

// Delete profile image - SAME PATTERN as deleteDishImage
export async function deleteProfileImage(imageUrl: string): Promise<boolean> {
  try {
    // Extract filename from URL (SAME as dishes)
    const urlParts = imageUrl.split("/");
    const fileName = urlParts[urlParts.length - 1];

    const { error } = await supabase.storage
      .from("dish-images")  // ✅ SAME BUCKET as dishes!
      .remove([fileName]);

    if (error) {
      console.error("Delete error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting profile image:", error);
    return false;
  }
}