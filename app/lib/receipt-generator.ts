// app/lib/receipt-generator.ts
// Generates thermal printer-friendly receipt HTML

import { Order } from '../../types';
import { formatCurrency } from '../../utils/currency';

export function generateReceiptHTML(order: Order, servedBy: string): string {
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = currentDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate items HTML
  const itemsHTML = order.items
    .map(
      (item) => `
        <div style="display: flex; justify-content: space-between; margin: 4px 0; font-size: 12px;">
          <div style="flex: 1;">
            ${item.quantity}x ${item.dish.name}
          </div>
          <div style="text-align: right; white-space: nowrap;">
            ${formatCurrency(item.dish.price * item.quantity)}
          </div>
        </div>
      `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Courier New', Courier, monospace;
          width: 80mm;
          padding: 10mm;
          background: white;
          color: black;
        }
        
        .receipt {
          width: 100%;
        }
        
        .divider {
          border-top: 1px dashed black;
          margin: 8px 0;
        }
        
        .divider-solid {
          border-top: 2px solid black;
          margin: 8px 0;
        }
        
        .center {
          text-align: center;
        }
        
        .bold {
          font-weight: bold;
        }
        
        .header {
          text-align: center;
          margin-bottom: 12px;
        }
        
        .restaurant-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 4px;
        }
        
        .restaurant-phone {
          font-size: 12px;
          margin-bottom: 8px;
        }
        
        .info-line {
          font-size: 12px;
          margin: 2px 0;
        }
        
        .items-section {
          margin: 12px 0;
        }
        
        .items-header {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .total-section {
          margin-top: 12px;
          padding-top: 8px;
        }
        
        .total-line {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          font-weight: bold;
          margin: 4px 0;
        }
        
        .footer {
          text-align: center;
          margin-top: 12px;
          font-size: 12px;
        }
        
        @media print {
          body {
            width: 80mm;
            padding: 0;
          }
          
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <!-- Header -->
        <div class="divider-solid"></div>
        <div class="header">
          <div class="restaurant-name">DELICIOUS BITES RESTAURANT</div>
          <div class="restaurant-phone">Phone: +256 700 123 456</div>
        </div>
        <div class="divider-solid"></div>
        
        <!-- Date & Server Info -->
        <div class="info-line">📅 ${formattedDate} • ${formattedTime}</div>
        <div class="info-line">Served by: ${servedBy}</div>
        
        <div class="divider"></div>
        
        <!-- Items Section -->
        <div class="items-section">
          <div class="items-header">ITEMS</div>
          <div class="divider"></div>
          ${itemsHTML}
        </div>
        
        <div class="divider"></div>
        
        <!-- Total Section -->
        <div class="total-section">
          <div class="total-line">
            <span>TOTAL:</span>
            <span>${formatCurrency(order.totalAmount)}</span>
          </div>
        </div>
        
        <div class="divider-solid"></div>
        
        <!-- Footer -->
        <div class="footer">
          <div class="bold">THANK YOU!</div>
        </div>
        
        <div class="divider-solid"></div>
      </div>
    </body>
    </html>
  `;
}

// Generate plain text receipt (fallback for SMS/simple display)
export function generateReceiptText(order: Order, servedBy: string): string {
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = currentDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  let receipt = `================================
   DELICIOUS BITES RESTAURANT
    Phone: +256 700 123 456
================================
📅 ${formattedDate} • ${formattedTime}
Served by: ${servedBy}
--------------------------------
ITEMS
--------------------------------
`;

  order.items.forEach((item) => {
    const itemTotal = formatCurrency(item.dish.price * item.quantity);
    receipt += `${item.quantity}x ${item.dish.name.padEnd(20)} ${itemTotal}\n`;
  });

  receipt += `--------------------------------
TOTAL:              ${formatCurrency(order.totalAmount)}
================================
          THANK YOU!
================================`;

  return receipt;
}