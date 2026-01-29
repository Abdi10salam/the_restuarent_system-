// app/lib/print-service.ts
// Handles receipt printing using expo-print

import * as Print from 'expo-print';
import { Order } from '../../types';
import { generateReceiptHTML } from './receipt-generator';

export interface PrintResult {
  success: boolean;
  error?: string;
}

/**
 * Print a receipt for an order
 * @param order - The order to print
 * @param servedBy - Name of the person who served/placed the order
 * @returns Promise with success status
 */
export async function printReceipt(
  order: Order,
  servedBy: string
): Promise<PrintResult> {
  try {
    console.log('🖨️ Starting receipt print...');
    console.log('Order ID:', order.id);
    console.log('Served by:', servedBy);

    // Generate receipt HTML
    const html = generateReceiptHTML(order, servedBy);

    // Print the receipt
    // This opens the native print dialog where user selects printer
    await Print.printAsync({
      html,
      width: 80 * 3.7795275591, // 80mm in points (thermal printer width)
      height: undefined, // Auto height based on content
    });

    console.log('✅ Receipt sent to printer successfully');

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('❌ Print error:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to print receipt',
    };
  }
}

/**
 * Generate a printable PDF and share it
 * Alternative to direct printing - creates PDF that can be shared
 */
export async function createReceiptPDF(
  order: Order,
  servedBy: string
): Promise<{ success: boolean; uri?: string; error?: string }> {
  try {
    const html = generateReceiptHTML(order, servedBy);

    const { uri } = await Print.printToFileAsync({
      html,
      width: 80 * 3.7795275591,
      height: undefined,
    });

    console.log('✅ PDF created:', uri);

    return {
      success: true,
      uri,
    };
  } catch (error: any) {
    console.error('❌ PDF creation error:', error);

    return {
      success: false,
      error: error.message || 'Failed to create PDF',
    };
  }
}