// app/(admin)/customers.tsx - COMPLETE UPDATED VERSION
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Modal, ActivityIndicator } from 'react-native';
import { Users, DollarSign, Receipt, Plus, Mail, User, CreditCard, Clock, UserCog, X } from 'lucide-react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { useApp } from '../../context/AppContext';
import { Customer } from '../../types';
import { formatCurrency } from '../../utils/currency';

export default function AdminCustomersScreen() {
  const { state, dispatch, addCustomerToSupabase } = useApp();
  const { customers, orders } = state;
  const { signUp } = useSignUp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showStaffOrders, setShowStaffOrders] = useState<string | null>(null); // 🆕 NEW
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    role: 'customer' as 'customer' | 'receptionist',
    paymentType: 'monthly' as 'cash' | 'monthly'
  });

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.email) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!newCustomer.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    const existingCustomer = customers.find(c => c.email === newCustomer.email);
    if (existingCustomer) {
      Alert.alert('Error', 'A user with this email already exists');
      return;
    }

    setIsSubmitting(true);

    try {
      const customer: Customer = {
        id: Date.now().toString(),
        name: newCustomer.name,
        email: newCustomer.email,
        customerNumber: 0,
        role: newCustomer.role,
        paymentType: newCustomer.paymentType,
        monthlyBalance: 0,
        totalSpent: 0,
        isFirstLogin: true,
        registeredAt: new Date().toISOString(),
      };

      const customerNumber = await addCustomerToSupabase(customer, 'admin@test.com');

      setNewCustomer({ name: '', email: '', role: 'customer', paymentType: 'monthly' });
      setShowAddModal(false);

      Alert.alert(
        'Success',
        `${newCustomer.role === 'receptionist' ? 'Receptionist' : 'Customer'} registered!\nAccount Number: ${customerNumber}\nThey can now login with ${newCustomer.email}`,
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      console.error('Error creating user:', err);
      Alert.alert(
        'Error',
        err.message || 'Failed to register user. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateMonthlyBill = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer || customer.monthlyBalance === 0) {
      Alert.alert('Info', 'No outstanding balance for this customer');
      return;
    }

    dispatch({ type: 'GENERATE_MONTHLY_BILL', customerId });
    Alert.alert('Success', 'Monthly bill generated successfully!');
  };

  // Get customer order statistics
  const getCustomerStats = (customerId: string) => {
    const customerOrders = orders.filter(order => order.customerId === customerId);
    const completedOrders = customerOrders.filter(order => order.status === 'approved');
    return {
      totalOrders: completedOrders.length,
      pendingOrders: customerOrders.filter(order => order.status === 'pending').length,
      revenue: completedOrders.reduce((sum, o) => sum + o.totalAmount, 0),
    };
  };

  // 🆕 NEW: Get staff order statistics
  const getStaffStats = (staffId: string) => {
    const staffOrders = orders.filter(order => order.placedBy === staffId);
    return {
      totalOrders: staffOrders.length,
      pendingOrders: staffOrders.filter(o => o.status === 'pending').length,
      walkInOrders: staffOrders.filter(o => o.isWalkIn).length,
      customerOrders: staffOrders.filter(o => !o.isWalkIn).length,
      approvedOrders: staffOrders.filter(o => o.status === 'approved').length,
      revenue: staffOrders
        .filter(o => o.status === 'approved')
        .reduce((sum, o) => sum + o.totalAmount, 0),
      orders: staffOrders.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>User Management</Text>
          <Text style={styles.subtitle}>
            {customers.filter(c => c.role === 'customer').length} customers • {customers.filter(c => c.role === 'receptionist').length} receptionists
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {customers.map((customer) => {
          const isReceptionist = customer.role === 'receptionist';
          const stats = isReceptionist 
            ? getStaffStats(customer.id)  // 🆕 Get staff stats
            : getCustomerStats(customer.id);
          
          return (
            <TouchableOpacity
              key={customer.id}
              style={styles.customerCard}
              onPress={() => isReceptionist && setShowStaffOrders(customer.id)}  // 🆕 Click to view orders
              activeOpacity={isReceptionist ? 0.7 : 1}
            >
              <View style={styles.customerHeader}>
                <View style={styles.customerInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.customerName}>{customer.name}</Text>
                    {isReceptionist && (
                      <View style={styles.receptionistBadge}>
                        <UserCog size={12} color="#fff" strokeWidth={2} />
                        <Text style={styles.receptionistBadgeText}>Staff</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.customerEmail}>{customer.email}</Text>
                  <Text style={styles.customerNumber}>#{customer.customerNumber}</Text>
                  <View style={styles.customerMeta}>
                    {!isReceptionist && (
                      <Text style={[
                        styles.paymentType,
                        { backgroundColor: customer.paymentType === 'monthly' ? '#DBEAFE' : '#D1FAE5' }
                      ]}>
                        {customer.paymentType === 'monthly' ? 'Monthly Billing' : 'Cash Only'}
                      </Text>
                    )}
                    {customer.isFirstLogin && (
                      <Text style={styles.firstLoginBadge}>First Login Pending</Text>
                    )}
                  </View>
                </View>
                {/* 🆕 Show stats for both staff and customers */}
                <View style={styles.customerStats}>
                  {isReceptionist ? (
                    // Staff stats
                    <>
                      <View style={styles.statItem}>
                        <Receipt size={16} color="#10B981" strokeWidth={2} />
                        <Text style={styles.statText}>{stats.totalOrders} orders</Text>
                      </View>
                      <View style={styles.statItem}>
                        <DollarSign size={16} color="#F97316" strokeWidth={2} />
                        <Text style={styles.statText}>{formatCurrency(stats.revenue)}</Text>
                      </View>
                    </>
                  ) : (
                    // Customer stats
                    <>
                      <View style={styles.statItem}>
                        <Receipt size={16} color="#F97316" strokeWidth={2} />
                        <Text style={styles.statText}>{stats.totalOrders} orders</Text>
                      </View>
                      <View style={styles.statItem}>
                        <DollarSign size={16} color="#10B981" strokeWidth={2} />
                        <Text style={styles.statText}>{formatCurrency(customer.totalSpent)} spent</Text>
                      </View>
                      {stats.pendingOrders > 0 && (
                        <View style={styles.statItem}>
                          <Clock size={16} color="#F59E0B" strokeWidth={2} />
                          <Text style={styles.statText}>{stats.pendingOrders} pending</Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              </View>

              {!isReceptionist && customer.monthlyBalance > 0 && (
                <View style={styles.balanceSection}>
                  <View style={styles.balanceInfo}>
                    <Text style={styles.balanceLabel}>Outstanding Balance</Text>
                    <Text style={styles.balanceAmount}>{formatCurrency(customer.monthlyBalance)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.billButton}
                    onPress={() => generateMonthlyBill(customer.id)}
                  >
                    <Text style={styles.billButtonText}>Generate Bill</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {customers.length === 0 && (
          <View style={styles.emptyState}>
            <Users size={64} color="#D1D5DB" strokeWidth={1} />
            <Text style={styles.emptyText}>No users registered</Text>
            <Text style={styles.emptySubtext}>Add your first user to get started</Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Register User Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => !isSubmitting && setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Register New User</Text>
            <Text style={styles.modalDescription}>
              User will receive an OTP when they first login to verify their account
            </Text>

            <View style={styles.modalForm}>
              <View style={styles.inputContainer}>
                <User size={20} color="#6B7280" strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  value={newCustomer.name}
                  onChangeText={(text) => setNewCustomer(prev => ({ ...prev, name: text }))}
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.inputContainer}>
                <Mail size={20} color="#6B7280" strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  value={newCustomer.email}
                  onChangeText={(text) => setNewCustomer(prev => ({ ...prev, email: text }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.roleTypeContainer}>
                <Text style={styles.roleTypeLabel}>Account Type:</Text>
                <View style={styles.roleTypeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.roleTypeButton,
                      newCustomer.role === 'customer' && styles.selectedRoleType
                    ]}
                    onPress={() => setNewCustomer(prev => ({ ...prev, role: 'customer' }))}
                    disabled={isSubmitting}
                  >
                    <Users size={16} color={newCustomer.role === 'customer' ? '#fff' : '#6B7280'} strokeWidth={2} />
                    <Text style={[
                      styles.roleTypeText,
                      newCustomer.role === 'customer' && styles.selectedRoleTypeText
                    ]}>
                      Customer
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.roleTypeButton,
                      newCustomer.role === 'receptionist' && styles.selectedRoleType
                    ]}
                    onPress={() => setNewCustomer(prev => ({ ...prev, role: 'receptionist' }))}
                    disabled={isSubmitting}
                  >
                    <UserCog size={16} color={newCustomer.role === 'receptionist' ? '#fff' : '#6B7280'} strokeWidth={2} />
                    <Text style={[
                      styles.roleTypeText,
                      newCustomer.role === 'receptionist' && styles.selectedRoleTypeText
                    ]}>
                      Receptionist
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {newCustomer.role === 'customer' && (
                <View style={styles.paymentTypeContainer}>
                  <Text style={styles.paymentTypeLabel}>Payment Type:</Text>
                  <View style={styles.paymentTypeButtons}>
                    <TouchableOpacity
                      style={[
                        styles.paymentTypeButton,
                        newCustomer.paymentType === 'cash' && styles.selectedPaymentType
                      ]}
                      onPress={() => setNewCustomer(prev => ({ ...prev, paymentType: 'cash' }))}
                      disabled={isSubmitting}
                    >
                      <CreditCard size={16} color={newCustomer.paymentType === 'cash' ? '#fff' : '#6B7280'} strokeWidth={2} />
                      <Text style={[
                        styles.paymentTypeText,
                        newCustomer.paymentType === 'cash' && styles.selectedPaymentTypeText
                      ]}>
                        Cash
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.paymentTypeButton,
                        newCustomer.paymentType === 'monthly' && styles.selectedPaymentType
                      ]}
                      onPress={() => setNewCustomer(prev => ({ ...prev, paymentType: 'monthly' }))}
                      disabled={isSubmitting}
                    >
                      <Receipt size={16} color={newCustomer.paymentType === 'monthly' ? '#fff' : '#6B7280'} strokeWidth={2} />
                      <Text style={[
                        styles.paymentTypeText,
                        newCustomer.paymentType === 'monthly' && styles.selectedPaymentTypeText
                      ]}>
                        Monthly
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.addCustomerButton, isSubmitting && styles.disabledButton]}
                onPress={handleAddCustomer}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.addCustomerButtonText}>
                    Register {newCustomer.role === 'receptionist' ? 'Receptionist' : 'Customer'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🆕 NEW: Staff Orders Modal */}
      <Modal
        visible={!!showStaffOrders}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStaffOrders(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            {showStaffOrders && (() => {
              const staff = customers.find(c => c.id === showStaffOrders);
              const staffStats = getStaffStats(showStaffOrders);
              
              return (
                <>
                  <View style={styles.modalHeader}>
                    <View>
                      <Text style={styles.modalTitle}>{staff?.name}'s Orders</Text>
                      <Text style={styles.modalDescription}>
                        Orders placed by this staff member
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowStaffOrders(null)}>
                      <X size={24} color="#6B7280" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>

                  {/* Staff Statistics */}
                  <View style={styles.staffStatsContainer}>
                    <View style={styles.staffStatCard}>
                      <Receipt size={20} color="#10B981" strokeWidth={2} />
                      <Text style={styles.staffStatValue}>{staffStats.totalOrders}</Text>
                      <Text style={styles.staffStatLabel}>Total Orders</Text>
                    </View>
                    <View style={styles.staffStatCard}>
                      <User size={20} color="#3B82F6" strokeWidth={2} />
                      <Text style={styles.staffStatValue}>{staffStats.walkInOrders}</Text>
                      <Text style={styles.staffStatLabel}>Walk-in</Text>
                    </View>
                    <View style={styles.staffStatCard}>
                      <Users size={20} color="#8B5CF6" strokeWidth={2} />
                      <Text style={styles.staffStatValue}>{staffStats.customerOrders}</Text>
                      <Text style={styles.staffStatLabel}>For Customers</Text>
                    </View>
                  </View>

                  <View style={styles.revenueCard}>
                    <DollarSign size={24} color="#F97316" strokeWidth={2} />
                    <View style={styles.revenueInfo}>
                      <Text style={styles.revenueLabel}>Total Revenue</Text>
                      <Text style={styles.revenueAmount}>
                        {formatCurrency(staffStats.revenue)}
                      </Text>
                    </View>
                  </View>

                  {/* Orders List */}
                  <ScrollView style={styles.staffOrdersList}>
                    <Text style={styles.orderListTitle}>Order History</Text>
                    {staffStats.orders.length === 0 ? (
                      <Text style={styles.noOrdersText}>No orders placed yet</Text>
                    ) : (
                      staffStats.orders.map((order) => (
                        <View key={order.id} style={styles.staffOrderItem}>
                          <View style={styles.staffOrderHeader}>
                            <Text style={styles.staffOrderId}>#{order.id.slice(-6)}</Text>
                            {order.isWalkIn && (
                              <View style={styles.walkInBadge}>
                                <Text style={styles.walkInText}>Walk-in</Text>
                              </View>
                            )}
                            <View style={[
                              styles.statusBadge,
                              {
                                backgroundColor:
                                  order.status === 'pending' ? '#FEF3C7' :
                                  order.status === 'approved' ? '#D1FAE5' : '#FEE2E2'
                              }
                            ]}>
                              <Text style={[
                                styles.statusText,
                                {
                                  color:
                                    order.status === 'pending' ? '#F59E0B' :
                                    order.status === 'approved' ? '#10B981' : '#EF4444'
                                }
                              ]}>
                                {order.status}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.staffOrderCustomer}>{order.customerName}</Text>
                          <View style={styles.staffOrderFooter}>
                            <Text style={styles.staffOrderDate}>
                              {new Date(order.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Text>
                            <Text style={styles.staffOrderAmount}>
                              {formatCurrency(order.totalAmount)}
                            </Text>
                          </View>
                        </View>
                      ))
                    )}
                  </ScrollView>
                </>
              );
            })()}
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
  addButton: {
    backgroundColor: '#10B981',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  customerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  receptionistBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  receptionistBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  customerEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  customerNumber: {
    fontSize: 14,
    color: '#F97316',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  customerMeta: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  paymentType: {
    fontSize: 12,
    color: '#1F2937',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: 'bold',
  },
  firstLoginBadge: {
    fontSize: 12,
    color: '#F59E0B',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: 'bold',
  },
  customerStats: {
    gap: 6,
    alignItems: 'flex-end',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
  },
  balanceSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F97316',
  },
  billButton: {
    backgroundColor: '#F97316',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  billButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 4,
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
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalForm: {
    gap: 16,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  roleTypeContainer: {
    gap: 12,
  },
  roleTypeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  roleTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  selectedRoleType: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  roleTypeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  selectedRoleTypeText: {
    color: '#fff',
  },
  paymentTypeContainer: {
    gap: 12,
  },
  paymentTypeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  paymentTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  selectedPaymentType: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  paymentTypeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  selectedPaymentTypeText: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  addCustomerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
  },

  addCustomerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },

  disabledButton: {
    opacity: 0.6,
  },

  // NEW: Staff orders modal styles
  staffStatsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },

  staffStatCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },

  staffStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },

  staffStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  revenueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3E2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },

  revenueInfo: {
    marginLeft: 12,
  },

  revenueLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },

  revenueAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F97316',
  },

  staffOrdersList: {
    maxHeight: 300,
  },

  orderListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },

  noOrdersText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 32,
  },

  staffOrderItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },

  staffOrderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },

  staffOrderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },

  walkInBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  walkInText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#F59E0B',
  },

  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },

  staffOrderCustomer: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 6,
  },

  staffOrderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  staffOrderDate: {
    fontSize: 12,
    color: '#6B7280',
  },

  staffOrderAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
  },
});