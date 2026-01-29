// app/(admin)/monthly-bills.tsx - FIXED VERSION
import React, { useState, useLayoutEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { Receipt, DollarSign, Calendar, CreditCard, CheckCircle, X, User, Mail, Download, FileText, Search, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/currency';
import { Customer } from '../../types';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function MonthlyBillsScreen() {
  const navigation = useNavigation();
  const { state, updateCustomerInSupabase } = useApp();
  const { customers, orders } = state;

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Calendar state
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isSelectingRange, setIsSelectingRange] = useState(false);

  // Get date range for filtering
  const getDateRange = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    } else if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(startDate);
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    } else {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
  };

  const dateRange = useMemo(() => getDateRange(), [startDate, endDate]);

  const getDateDisplayText = () => {
    if (startDate && endDate && startDate.getTime() !== endDate.getTime()) {
      return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (startDate) {
      return startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } else {
      return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    const selected = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth(), day);

    if (!isSelectingRange) {
      setStartDate(selected);
      setEndDate(null);
      setIsSelectingRange(true);
    } else {
      if (selected < startDate!) {
        setEndDate(startDate);
        setStartDate(selected);
      } else {
        setEndDate(selected);
      }
      setIsSelectingRange(false);
      setShowCalendarModal(false);
    }
  };

  const isDateInRange = (day: number) => {
    if (!startDate) return false;
    const date = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth(), day);

    if (endDate) {
      return date >= startDate && date <= endDate;
    } else {
      return date.getTime() === startDate.getTime();
    }
  };

  const isDateStart = (day: number) => {
    if (!startDate) return false;
    const date = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth(), day);
    return date.getTime() === startDate.getTime();
  };

  const isDateEnd = (day: number) => {
    if (!endDate) return false;
    const date = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth(), day);
    return date.getTime() === endDate.getTime();
  };

  const clearSelection = () => {
    setStartDate(null);
    setEndDate(null);
    setIsSelectingRange(false);
  };

  const navigateCalendarMonth = (direction: number) => {
    const newDate = new Date(currentCalendarMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentCalendarMonth(newDate);
  };

  // Filter orders by date range
  const ordersInPeriod = useMemo(() => {
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= dateRange.startDate &&
        orderDate <= dateRange.endDate &&
        order.status === 'approved' &&
        order.paymentType === 'monthly';
    });
  }, [orders, dateRange]);

  // ✅ FIX: Calculate customers with balance using ACTUAL database balance
  const customersWithBalance = useMemo(() => {
    // Get period order totals for display purposes only
    const customerPeriodOrders = new Map<string, number>();

    ordersInPeriod.forEach(order => {
      const currentTotal = customerPeriodOrders.get(order.customerId) || 0;
      customerPeriodOrders.set(order.customerId, currentTotal + order.totalAmount);
    });

    // Filter customers who:
    // 1. Are monthly payment type
    // 2. Have actual outstanding balance in database (not just in period)
    const result = customers
      .filter(customer => 
        customer.paymentType === 'monthly' && 
        customer.monthlyBalance > 0  // ✅ Use actual database balance
      )
      .map(customer => ({
        ...customer,
        periodOrders: customerPeriodOrders.get(customer.id) || 0, // For display only
      }));

    console.log('📊 Customers with balance:', result.length);
    result.forEach(c => {
      console.log(`  - ${c.name}: Balance=${c.monthlyBalance}, Period Orders=${c.periodOrders}`);
    });

    return result;
  }, [customers, ordersInPeriod]);

  // Set header right
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerCalendarButton}
          onPress={() => setShowCalendarModal(true)}
        >
          <Calendar size={16} color="#F97316" strokeWidth={2} />
          <Text style={styles.headerDateText} numberOfLines={1}>
            {getDateDisplayText()}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, startDate, endDate]);

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    return customersWithBalance.filter(customer => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;

      const nameMatch = customer.name.toLowerCase().includes(query);
      const numberMatch = customer.customerNumber.toString().includes(query);
      const emailMatch = customer.email.toLowerCase().includes(query);

      return nameMatch || numberMatch || emailMatch;
    });
  }, [customersWithBalance, searchQuery]);

  // ✅ FIX: Use actual database balance for total
  const totalOutstanding = useMemo(() => {
    return filteredCustomers.reduce((sum, customer) => sum + customer.monthlyBalance, 0);
  }, [filteredCustomers]);

  const getCustomerOrders = (customerId: string) => {
    return ordersInPeriod.filter(order => order.customerId === customerId);
  };

  const handlePayment = (customer: Customer & { periodOrders: number }) => {
    console.log('💳 Opening payment modal for:', {
      name: customer.name,
      actualBalance: customer.monthlyBalance,
      periodOrders: customer.periodOrders
    });
    
    setSelectedCustomer(customer);
    // ✅ FIX: Pre-fill with actual balance, not period orders
    setPaymentAmount(customer.monthlyBalance.toString());
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    if (!selectedCustomer) return;

    const amount = parseFloat(paymentAmount);
    // ✅ FIX: Use actual database balance for validation
    const customerBalance = selectedCustomer.monthlyBalance;

    console.log('💰 Processing payment:', { 
      customer: selectedCustomer.name,
      amount, 
      currentBalance: customerBalance 
    });

    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount');
      return;
    }

    if (amount > customerBalance) {
      Alert.alert('Amount Too High', `Payment amount cannot exceed outstanding balance of ${formatCurrency(customerBalance)}`);
      return;
    }

    setIsProcessing(true);

    try {
      const newBalance = customerBalance - amount;

      console.log('📝 Updating customer balance:', {
        customerId: selectedCustomer.id,
        oldBalance: customerBalance,
        paymentAmount: amount,
        newBalance
      });

      await updateCustomerInSupabase(selectedCustomer.id, {
        monthlyBalance: newBalance
      });

      console.log('✅ Payment processed successfully');

      Alert.alert(
        'Payment Successful! ✅',
        `${formatCurrency(amount)} paid by ${selectedCustomer.name}\n${
          newBalance > 0
            ? `Remaining balance: ${formatCurrency(newBalance)}`
            : 'Balance cleared!'
        }`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowPaymentModal(false);
              setSelectedCustomer(null);
              setPaymentAmount('');
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Payment processing error:', error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePDFReport = async () => {
    setIsGeneratingPDF(true);

    try {
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Billing Report - ${getDateDisplayText()}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { margin: 20mm; }
            body { font-family: 'Helvetica', 'Arial', sans-serif; color: #1F2937; line-height: 1.6; font-size: 12pt; }
            
            .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 4px solid #F97316; }
            .restaurant-name { font-size: 32pt; font-weight: 700; color: #1F2937; margin-bottom: 8px; letter-spacing: 0.5px; }
            .report-title { font-size: 16pt; color: #6B7280; margin-bottom: 12px; font-weight: 500; }
            .report-meta { font-size: 10pt; color: #9CA3AF; display: flex; justify-content: center; gap: 20px; }
            .report-meta span { padding: 4px 12px; background: #F3F4F6; border-radius: 4px; }
            
            .customer-table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; margin-bottom: 24px; }
            .customer-table thead { background: linear-gradient(to bottom, #F97316, #EA580C); color: white; }
            .customer-table th { padding: 12px 16px; text-align: left; font-size: 10pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
            .customer-table th:first-child { width: 40px; text-align: center; }
            .customer-table th:last-child { text-align: right; width: 140px; }
            .customer-table tbody tr { border-bottom: 1px solid #E5E7EB; }
            .customer-table tbody tr:nth-child(even) { background: #F9FAFB; }
            .customer-table td { padding: 14px 16px; font-size: 10pt; vertical-align: top; }
            .customer-table td:first-child { text-align: center; font-weight: 600; color: #6B7280; font-size: 11pt; }
            .customer-table td:last-child { text-align: right; font-weight: 700; color: #F97316; font-size: 12pt; }
            
            .customer-name { font-size: 11pt; font-weight: 600; color: #1F2937; margin-bottom: 4px; }
            .customer-contact { font-size: 9pt; color: #6B7280; line-height: 1.6; margin-bottom: 2px; }
            .customer-badge { display: inline-block; background: #F97316; color: white; padding: 2px 8px; border-radius: 4px; font-size: 8pt; font-weight: 600; margin-top: 4px; }
            
            .total-row { background: linear-gradient(to bottom, #FEF3E2, #FED7AA) !important; border-top: 3px solid #F97316 !important; }
            .total-row td { padding: 16px !important; font-weight: 700 !important; }
            .total-label { text-align: right !important; font-size: 12pt !important; text-transform: uppercase; letter-spacing: 1px; color: #1F2937 !important; }
            .total-amount { font-size: 18pt !important; color: #000000 !important; }
            
            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #E5E7EB; text-align: center; }
            .footer-text { font-size: 9pt; color: #6B7280; line-height: 1.8; margin-bottom: 4px; }
            .footer-text.primary { font-weight: 600; color: #1F2937; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="restaurant-name">Hiil Restaurant</div>
            <div class="report-title">Customer Billing Report</div>
            <div class="report-meta">
              <span>📅 ${getDateDisplayText()}</span>
              <span>📄 Generated ${currentDate}</span>
            </div>
          </div>

          <table class="customer-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer Information</th>
                <th>Outstanding Balance</th>
              </tr>
            </thead>
            <tbody>
              ${customersWithBalance.map((customer, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>
                    <div class="customer-name">
                      ${customer.name}
                      <span class="customer-badge">#${customer.customerNumber}</span>
                    </div>
                    <div class="customer-contact">📧 ${customer.email}</div>
                    ${customer.phone ? `<div class="customer-contact">📱 ${customer.phone}</div>` : ''}
                  </td>
                  <td>${formatCurrency(customer.monthlyBalance)}</td>
                </tr>
              `).join('')}
              
              <tr class="total-row">
                <td colspan="2" class="total-label">Total Outstanding</td>
                <td class="total-amount">${formatCurrency(totalOutstanding)}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <p class="footer-text primary">This is an automated report generated by Hiil Restaurant Management System</p>
            <p class="footer-text">Report generated on ${currentDate}</p>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Billing Report - ${getDateDisplayText()}`,
          UTI: 'com.adobe.pdf'
        });
      } else {
        Alert.alert('Success', 'PDF generated successfully!');
      }

    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Error', 'Failed to generate PDF report.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentCalendarMonth);
    const firstDay = getFirstDayOfMonth(currentCalendarMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDayEmpty} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isInRange = isDateInRange(day);
      const isStart = isDateStart(day);
      const isEnd = isDateEnd(day);
      const isToday = new Date().getDate() === day &&
        new Date().getMonth() === currentCalendarMonth.getMonth() &&
        new Date().getFullYear() === currentCalendarMonth.getFullYear();

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isInRange && styles.calendarDayInRange,
            (isStart || isEnd) && styles.calendarDaySelected,
            isToday && !isInRange && styles.calendarDayToday,
          ]}
          onPress={() => handleDateSelect(day)}
        >
          <Text style={[
            styles.calendarDayText,
            (isStart || isEnd) && styles.calendarDayTextSelected,
            isToday && !isInRange && styles.calendarDayTextToday,
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Search size={20} color="#64748B" strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, number, or email..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94A3B8"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={20} color="#64748B" strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
          {searchQuery && (
            <Text style={styles.searchResults}>
              {filteredCustomers.length} result{filteredCustomers.length !== 1 ? 's' : ''} found
            </Text>
          )}
        </View>

        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Receipt size={24} color="#0EA5E9" strokeWidth={2} />
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{filteredCustomers.length}</Text>
              <Text style={styles.statLabel}>Customers</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <DollarSign size={24} color="#0284C7" strokeWidth={2} />
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{formatCurrency(totalOutstanding)}</Text>
              <Text style={styles.statLabel}>Outstanding</Text>
            </View>
          </View>
        </View>

        {/* Download PDF Button */}
        {customersWithBalance.length > 0 && (
          <View style={styles.pdfButtonContainer}>
            <TouchableOpacity
              style={[styles.pdfButton, isGeneratingPDF && styles.disabledButton]}
              onPress={generatePDFReport}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <>
                  <FileText size={20} color="#fff" strokeWidth={2} />
                  <Text style={styles.pdfButtonText}>Generating PDF...</Text>
                </>
              ) : (
                <>
                  <Download size={20} color="#fff" strokeWidth={2} />
                  <Text style={styles.pdfButtonText}>Download PDF Report</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Customer Bills */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Outstanding Balances</Text>

          {filteredCustomers.length === 0 ? (
            <View style={styles.emptyState}>
              {searchQuery ? (
                <>
                  <Search size={64} color="#CBD5E1" strokeWidth={1} />
                  <Text style={styles.emptyText}>No results found</Text>
                  <Text style={styles.emptySubtext}>Try searching with a different term</Text>
                </>
              ) : (
                <>
                  <CheckCircle size={64} color="#0EA5E9" strokeWidth={1} />
                  <Text style={styles.emptyText}>All Clear!</Text>
                  <Text style={styles.emptySubtext}>No outstanding balances</Text>
                </>
              )}
            </View>
          ) : (
            filteredCustomers.map((customer) => {
              const customerOrders = getCustomerOrders(customer.id);

              return (
                <View key={customer.id} style={styles.billCard}>
                  <View style={styles.billHeader}>
                    <View style={styles.customerInfo}>
                      <View style={styles.customerNameRow}>
                        <Text style={styles.customerName}>{customer.name}</Text>
                        <View style={styles.customerNumberBadge}>
                          <Text style={styles.customerNumberText}>#{customer.customerNumber}</Text>
                        </View>
                      </View>
                      <View style={styles.customerEmailRow}>
                        <Mail size={14} color="#6B7280" strokeWidth={2} />
                        <Text style={styles.customerEmail}>{customer.email}</Text>
                      </View>
                      {customer.phone && (
                        <View style={styles.customerPhoneRow}>
                          <Text style={styles.customerPhone}>📱 {customer.phone}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.balanceSection}>
                    <View style={styles.balanceRow}>
                      <Text style={styles.balanceLabel}>Total Outstanding</Text>
                      <Text style={styles.balanceAmount}>{formatCurrency(customer.monthlyBalance)}</Text>
                    </View>
                    <View style={styles.balanceRow}>
                      <Text style={styles.totalSpentLabel}>Orders in Period</Text>
                      <Text style={styles.totalSpentAmount}>{formatCurrency(customer.periodOrders)}</Text>
                    </View>
                    <View style={styles.balanceRow}>
                      <Text style={styles.totalSpentLabel}>Total Spent (All Time)</Text>
                      <Text style={styles.totalSpentAmount}>{formatCurrency(customer.totalSpent)}</Text>
                    </View>
                  </View>

                  {customerOrders.length > 0 && (
                    <View style={styles.orderSummary}>
                      <View style={styles.orderSummaryHeader}>
                        <Calendar size={16} color="#6B7280" strokeWidth={2} />
                        <Text style={styles.orderSummaryTitle}>
                          {customerOrders.length} order{customerOrders.length !== 1 ? 's' : ''} in period
                        </Text>
                      </View>

                      {customerOrders.slice(0, 3).map((order) => (
                        <View key={order.id} style={styles.orderItem}>
                          <Text style={styles.orderDate}>
                            {new Date(order.createdAt).toLocaleDateString()}
                          </Text>
                          <Text style={styles.orderId}>#{order.id.slice(-6)}</Text>
                          <Text style={styles.orderAmount}>{formatCurrency(order.totalAmount)}</Text>
                        </View>
                      ))}

                      {customerOrders.length > 3 && (
                        <Text style={styles.moreOrders}>
                          + {customerOrders.length - 3} more order{customerOrders.length - 3 !== 1 ? 's' : ''}
                        </Text>
                      )}
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.payButton}
                    onPress={() => handlePayment(customer)}
                  >
                    <CreditCard size={20} color="#fff" strokeWidth={2} />
                    <Text style={styles.payButtonText}>Process Payment</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendarModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Select Date Range</Text>
              <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                <X size={24} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarMonthNav}>
              <TouchableOpacity
                style={styles.calendarNavButton}
                onPress={() => navigateCalendarMonth(-1)}
              >
                <ChevronLeft size={20} color="#1F2937" strokeWidth={2} />
              </TouchableOpacity>

              <Text style={styles.calendarMonthText}>
                {currentCalendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>

              <TouchableOpacity
                style={styles.calendarNavButton}
                onPress={() => navigateCalendarMonth(1)}
              >
                <ChevronRight size={20} color="#1F2937" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarWeekDays}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} style={styles.calendarWeekDayText}>{day}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {renderCalendar()}
            </View>

            <View style={styles.calendarActions}>
              {(startDate || endDate) && (
                <TouchableOpacity
                  style={styles.calendarClearButton}
                  onPress={clearSelection}
                >
                  <Text style={styles.calendarClearText}>Clear Selection</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.calendarApplyButton}
                onPress={() => setShowCalendarModal(false)}
              >
                <Text style={styles.calendarApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>

            {isSelectingRange && startDate && (
              <Text style={styles.calendarHint}>
                Select end date (tap same date for single day)
              </Text>
            )}
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => !isProcessing && setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Process Payment</Text>
              <TouchableOpacity
                onPress={() => setShowPaymentModal(false)}
                disabled={isProcessing}
              >
                <X size={24} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {selectedCustomer && (
              <>
                <View style={styles.modalCustomerInfo}>
                  <User size={20} color="#6B7280" strokeWidth={2} />
                  <View style={styles.modalCustomerDetails}>
                    <Text style={styles.modalCustomerName}>{selectedCustomer.name}</Text>
                    <Text style={styles.modalCustomerEmail}>{selectedCustomer.email}</Text>
                  </View>
                </View>

                <View style={styles.modalBalanceInfo}>
                  <Text style={styles.modalBalanceLabel}>Outstanding Balance</Text>
                  <Text style={styles.modalBalanceAmount}>
                    {formatCurrency(selectedCustomer.monthlyBalance)}
                  </Text>
                </View>

                <View style={styles.paymentInputContainer}>
                  <Text style={styles.inputLabel}>Payment Amount</Text>
                  <View style={styles.inputWrapper}>
                    <DollarSign size={20} color="#6B7280" strokeWidth={2} />
                    <TextInput
                      style={styles.paymentInput}
                      placeholder="0.00"
                      value={paymentAmount}
                      onChangeText={setPaymentAmount}
                      keyboardType="decimal-pad"
                      editable={!isProcessing}
                    />
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowPaymentModal(false)}
                    disabled={isProcessing}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.confirmButton, isProcessing && styles.disabledButton]}
                    onPress={processPayment}
                    disabled={isProcessing}
                  >
                    <Text style={styles.confirmButtonText}>
                      {isProcessing ? 'Processing...' : 'Confirm Payment'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingTop: 16,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#0F172A',
  },
  searchResults: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: '#0EA5E9',
  },
  statInfo: {
    marginLeft: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  pdfButtonContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  pdfButton: {
    backgroundColor: '#0EA5E9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  pdfButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    marginLeft: 16,
  },
  billCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  billHeader: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  customerInfo: {
    flex: 1,
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  customerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  customerNumberBadge: {
    backgroundColor: '#F97316',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  customerNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  customerEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  customerEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  customerPhoneRow: {
    marginTop: 4,
  },
  customerPhone: {
    fontSize: 13,
    color: '#6B7280',
  },
  balanceSection: {
    backgroundColor: '#FEF3E2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F97316',
  },
  totalSpentLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  totalSpentAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  orderSummary: {
    marginBottom: 16,
  },
  orderSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  orderSummaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  orderId: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
    textAlign: 'center',
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  moreOrders: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  payButton: {
    backgroundColor: '#0EA5E9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalCustomerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalCustomerDetails: {
    flex: 1,
  },
  modalCustomerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  modalCustomerEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalBalanceInfo: {
    backgroundColor: '#FEF3E2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  modalBalanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  modalBalanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F97316',
  },
  paymentInputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#0EA5E9',
  },
  paymentInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.6,
  },
  calendarClearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  calendarClearText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  calendarApplyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
  },
  calendarApplyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  calendarHint: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  calendarWeekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  calendarWeekDayText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280',
    width: '14.28%',
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  calendarDayEmpty: {
    width: '14.28%',
    aspectRatio: 1,
  },
  calendarDayInRange: {
    backgroundColor: '#FED7AA',
  },
  calendarDaySelected: {
    backgroundColor: '#F97316',
    borderRadius: 8,
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: '#0EA5E9',
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  calendarDayTextToday: {
    color: '#0EA5E9',
    fontWeight: 'bold',
  },
  calendarModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  calendarMonthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  calendarNavButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  calendarMonthText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  calendarActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  headerCalendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEF3E2',
    borderRadius: 8,
  },
  headerDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F97316',
    maxWidth: 150,
  },
});