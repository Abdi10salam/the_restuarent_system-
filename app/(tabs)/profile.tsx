// app/(tabs)/profile.tsx - SIMPLIFIED MODERN VERSION

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Receipt, Calendar, LogOut, User, Mail, Phone, CreditCard, Clock } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/currency';

export default function ProfileScreen() {
  const { state: appState } = useApp();
  const { state: authState, logout } = useAuth();
  const router = useRouter();
  const { orders, customers } = appState;

  const user = authState.currentUser;

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // Get full customer data from customers array (has latest balance info)
  const customerData = customers.find(c => c.id === user.id) || user;

  // Calculate user statistics
  const userOrders = orders.filter(order => order.customerId === user.id);
  const completedOrders = userOrders.filter(order => order.status === 'approved');
  const pendingOrders = userOrders.filter(order => order.status === 'pending');
  const monthlyOrders = completedOrders.filter(order => order.paymentType === 'monthly');

  // Use customer data for balance (most up-to-date)
  const currentBalance = customerData.monthlyBalance || 0;
  const totalSpent = customerData.totalSpent || 0;
  const totalPaid = totalSpent - currentBalance;

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/portal-selection');
          }
        }
      ]
    );
  };

  const handleViewOrders = () => {
    router.push('/(tabs)/orders');
  };

  const handlePaymentSummaryTap = () => {
    if (currentBalance > 0) {
      Alert.alert(
        'Payment Summary',
        `Outstanding Balance: ${formatCurrency(currentBalance)}\n\nTotal Spent: ${formatCurrency(totalSpent)}\nTotal Paid: ${formatCurrency(totalPaid)}\n\nPlease visit the reception to make a payment.`,
        [
          { text: 'View Orders', onPress: handleViewOrders },
          { text: 'OK' }
        ]
      );
    } else {
      Alert.alert(
        'Payment Summary',
        `You have no outstanding balance!\n\nTotal Spent: ${formatCurrency(totalSpent)}\nCompleted Orders: ${completedOrders.length}`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>My Profile</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#EF4444" strokeWidth={2} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            {customerData.profilePhoto ? (
              <Image
                source={{ uri: customerData.profilePhoto }}
                style={styles.profilePhoto}
              />
            ) : (
              <View style={styles.profilePhotoPlaceholder}>
                <User size={48} color="#F97316" strokeWidth={2} />
              </View>
            )}

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{customerData.name}</Text>
              <View style={styles.profileDetail}>
                <Mail size={14} color="#6B7280" strokeWidth={2} />
                <Text style={styles.profileDetailText}>{customerData.email}</Text>
              </View>
              {customerData.phone && (
                <View style={styles.profileDetail}>
                  <Phone size={14} color="#6B7280" strokeWidth={2} />
                  <Text style={styles.profileDetailText}>{customerData.phone}</Text>
                </View>
              )}
              <View style={styles.profileBadge}>
                <CreditCard size={12} color="#fff" strokeWidth={2} />
                <Text style={styles.profileBadgeText}>
                  {customerData.paymentType === 'monthly' ? 'Monthly Billing' : 'Cash Only'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payment Summary - Enhanced & Interactive */}
        <TouchableOpacity
          style={styles.paymentSummaryCard}
          onPress={handlePaymentSummaryTap}
          activeOpacity={0.8}
        >
          <View style={styles.paymentSummaryHeader}>
            <View style={styles.paymentSummaryTitle}>

              <Text style={styles.paymentSummaryTitleText}>Payment Summary</Text>
            </View>
            <Text style={styles.tapHint}>Tap for details →</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Ordered</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalSpent)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Paid</Text>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>{formatCurrency(totalPaid)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.completedOrdersInfo}>
              <Text style={styles.summaryLabel}>Completed Orders</Text>
            </View>
            <Text style={[styles.summaryValue, { color: '#8B5CF6', fontSize: 20, fontWeight: 'bold' }]}>
              {completedOrders.length}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalLabel}>Balance Due</Text>
            <Text style={[styles.summaryTotalValue, currentBalance > 0 && { color: '#F97316' }]}>
              {formatCurrency(currentBalance)}
            </Text>
          </View>

          <View style={styles.summaryDivider} />


        </TouchableOpacity>

        {/* Order Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Activity</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Clock size={20} color="#F59E0B" strokeWidth={2} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityLabel}>Pending Orders</Text>
                <Text style={styles.activityValue}>{pendingOrders.length} orders awaiting approval</Text>
              </View>
            </View>

            <View style={styles.activityDivider} />

            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Receipt size={20} color="#10B981" strokeWidth={2} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityLabel}>Completed Orders</Text>
                <Text style={styles.activityValue}>{completedOrders.length} orders delivered</Text>
              </View>
            </View>

            {customerData.paymentType === 'monthly' && (
              <>
                <View style={styles.activityDivider} />
                <View style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Calendar size={20} color="#3B82F6" strokeWidth={2} />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityLabel}>Monthly Orders</Text>
                    <Text style={styles.activityValue}>{monthlyOrders.length} orders this billing cycle</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Recent Orders */}
        {completedOrders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              <TouchableOpacity onPress={handleViewOrders}>
                <Text style={styles.viewAllText}>View All →</Text>
              </TouchableOpacity>
            </View>

            {completedOrders.slice(0, 3).map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderBadgeText}>#{order.id.slice(-6)}</Text>
                  </View>
                  <Text style={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </Text>
                </View>

                <Text style={styles.orderItems} numberOfLines={2}>
                  {order.items.map(item => `${item.quantity}x ${item.dish.name}`).join(', ')}
                </Text>

                <View style={styles.orderFooter}>
                  <View style={styles.orderPaymentBadge}>
                    <Text style={styles.orderPaymentText}>
                      {order.paymentType === 'monthly' ? '📅 Monthly' : '💵 Cash'}
                    </Text>
                  </View>
                  <Text style={styles.orderAmount}>{formatCurrency(order.totalAmount)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty State for No Orders */}
        {completedOrders.length === 0 && (
          <View style={styles.emptyState}>
            <Receipt size={64} color="#D1D5DB" strokeWidth={1} />
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySubtext}>
              Start ordering from our menu to see your order history here
            </Text>
            <TouchableOpacity
              style={styles.browseMenuButton}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.browseMenuText}>Browse Menu</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  profileHeader: {
    flexDirection: 'row',
    gap: 16,
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
  },
  profilePhotoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3E2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F97316',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  profileDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  profileDetailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F97316',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  profileBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  paymentSummaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    borderLeftWidth: 5,
    borderLeftColor: '#F97316',
  },
  paymentSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  paymentSummaryTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paymentSummaryTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  tapHint: {
    fontSize: 12,
    color: '#F97316',
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  summaryTotalLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  summaryTotalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  completedOrdersInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F97316',
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  activityValue: {
    fontSize: 13,
    color: '#6B7280',
  },
  activityDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  orderBadgeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  orderDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  orderItems: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
    lineHeight: 20,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderPaymentBadge: {
    backgroundColor: '#FEF3E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  orderPaymentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F97316',
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F97316',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    marginTop: 20,
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
    marginBottom: 20,
  },
  browseMenuButton: {
    backgroundColor: '#F97316',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseMenuText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  bottomPadding: {
    height: 60,
  },
});
