// app/(admin)/monthly-bills.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { Receipt, DollarSign, Calendar, CreditCard, CheckCircle, X, User, Mail } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/currency';
import { Customer } from '../../types';

export default function MonthlyBillsScreen() {
  const { state, updateCustomerInSupabase } = useApp();
  const { customers, orders } = state;
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Get customers with outstanding balances (monthly billing only)
  const customersWithBalance = customers.filter(
    customer => customer.paymentType === 'monthly' && customer.monthlyBalance > 0
  );

  // Calculate total outstanding across all customers
  const totalOutstanding = customersWithBalance.reduce(
    (sum, customer) => sum + customer.monthlyBalance,
    0
  );

  // Get orders for a specific customer
  const getCustomerOrders = (customerId: string) => {
    return orders.filter(
      order => 
        order.customerId === customerId && 
        order.status === 'approved' && 
        order.paymentType === 'monthly'
    );
  };

  // Open payment modal
  const handlePayment = (customer: Customer) => {
    setSelectedCustomer(customer);
    setPaymentAmount(customer.monthlyBalance.toString());
    setShowPaymentModal(true);
  };

  // Process payment
  const processPayment = async () => {
    if (!selectedCustomer) return;

    const amount = parseFloat(paymentAmount);
    
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount');
      return;
    }

    if (amount > selectedCustomer.monthlyBalance) {
      Alert.alert('Amount Too High', 'Payment amount cannot exceed outstanding balance');
      return;
    }

    setIsProcessing(true);

    try {
      const newBalance = selectedCustomer.monthlyBalance - amount;

      await updateCustomerInSupabase(selectedCustomer.id, {
        monthlyBalance: newBalance
      });

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
      console.error('Payment processing error:', error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Get current month name
  const getCurrentMonth = () => {
    return new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Monthly Bills</Text>
          <Text style={styles.subtitle}>{getCurrentMonth()}</Text>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalLabel}>Total Outstanding</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalOutstanding)}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Receipt size={24} color="#10B981" strokeWidth={2} />
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{customersWithBalance.length}</Text>
              <Text style={styles.statLabel}>Customers</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <DollarSign size={24} color="#F97316" strokeWidth={2} />
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{formatCurrency(totalOutstanding)}</Text>
              <Text style={styles.statLabel}>Outstanding</Text>
            </View>
          </View>
        </View>

        {/* Customer Bills */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Outstanding Balances</Text>
          
          {customersWithBalance.length === 0 ? (
            <View style={styles.emptyState}>
              <CheckCircle size={64} color="#10B981" strokeWidth={1} />
              <Text style={styles.emptyText}>All Clear!</Text>
              <Text style={styles.emptySubtext}>No outstanding balances at the moment</Text>
            </View>
          ) : (
            customersWithBalance.map((customer) => {
              const customerOrders = getCustomerOrders(customer.id);
              
              return (
                <View key={customer.id} style={styles.billCard}>
                  {/* Customer Info */}
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
                    </View>
                  </View>

                  {/* Balance Display */}
                  <View style={styles.balanceSection}>
                    <View style={styles.balanceRow}>
                      <Text style={styles.balanceLabel}>Outstanding Balance</Text>
                      <Text style={styles.balanceAmount}>{formatCurrency(customer.monthlyBalance)}</Text>
                    </View>
                    <View style={styles.balanceRow}>
                      <Text style={styles.totalSpentLabel}>Total Spent</Text>
                      <Text style={styles.totalSpentAmount}>{formatCurrency(customer.totalSpent)}</Text>
                    </View>
                  </View>

                  {/* Order Summary */}
                  <View style={styles.orderSummary}>
                    <View style={styles.orderSummaryHeader}>
                      <Calendar size={16} color="#6B7280" strokeWidth={2} />
                      <Text style={styles.orderSummaryTitle}>
                        {customerOrders.length} order{customerOrders.length !== 1 ? 's' : ''} this month
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

                  {/* Payment Button */}
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
  header: {
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  totalBadge: {
    backgroundColor: '#FEF3E2',
    padding: 12,
    borderRadius: 12,
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F97316',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
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
  },
  customerEmail: {
    fontSize: 14,
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
    backgroundColor: '#10B981',
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
    borderColor: '#10B981',
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
    backgroundColor: '#10B981',
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
});