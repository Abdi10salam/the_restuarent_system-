import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { ChartBar as BarChart3, DollarSign, Clock, CircleCheck as CheckCircle, LogOut, Users, Receipt } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useRouter } from 'expo-router';
import { formatCurrency } from '../../utils/currency';

export default function AdminDashboardScreen() {
  const { state: authState, logout } = useAuth();
  const { state } = useApp();
  const router = useRouter();
  const { orders, customers } = state;

  const pendingOrders = orders.filter(order => order.status === 'pending');
  const approvedOrders = orders.filter(order => order.status === 'approved');
  const totalRevenue = approvedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  
  // ✅ FIX: Sum up positive balances only (customers who owe money)
  const monthlyBilling = customers
    .filter(customer => customer.monthlyBalance > 0)  // Only positive balances
    .reduce((sum, customer) => sum + customer.monthlyBalance, 0);
  
  const activeCustomers = customers.filter(c => c.role === 'customer').length;

  const handleLogout = () => {
    logout();
    router.replace('/portal-selection');
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Stats Overview */}
        <View style={styles.section}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Clock size={24} color="#F59E0B" strokeWidth={2} />
              <Text style={styles.statValue}>{pendingOrders.length}</Text>
              <Text style={styles.statLabel}>Pending Orders</Text>
            </View>
            
            <View style={styles.statCard}>
              <CheckCircle size={24} color="#10B981" strokeWidth={2} />
              <Text style={styles.statValue}>{approvedOrders.length}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            
            <View style={styles.statCard}>
              <DollarSign size={24} color="#F97316" strokeWidth={2} />
              <Text style={styles.statValue}>{formatCurrency(totalRevenue)}</Text>
              <Text style={styles.statLabel}>Total Revenue</Text>
            </View>
            
            <View style={styles.statCard}>
              <Users size={24} color="#8B5CF6" strokeWidth={2} />
              <Text style={styles.statValue}>{activeCustomers}</Text>
              <Text style={styles.statLabel}>Active Customers</Text>
            </View>
            
            <View style={styles.statCard}>
              <Receipt size={24} color="#06B6D4" strokeWidth={2} />
              <Text style={styles.statValue}>{formatCurrency(monthlyBilling)}</Text>
              <Text style={styles.statLabel}>Monthly Bills</Text>
            </View>
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          {orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No orders yet</Text>
              <Text style={styles.emptySubtext}>Orders will appear here when customers place them</Text>
            </View>
          ) : (
            orders.slice(0, 5).map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>#{order.id.slice(-6)}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: order.status === 'pending' ? '#FEF3C7' : 
                                     order.status === 'approved' ? '#D1FAE5' : '#FEE2E2' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: order.status === 'pending' ? '#F59E0B' : 
                               order.status === 'approved' ? '#10B981' : '#EF4444' }
                    ]}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.orderAmount}>{formatCurrency(order.totalAmount)}</Text>
                </View>
                <Text style={styles.customerInfo}>
                  Customer: {order.customerName} ({order.customerEmail})
                </Text>
                <Text style={styles.orderDate}>
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <Text style={styles.orderItems}>
                  {order.items.map(item => `${item.quantity}x ${item.dish.name}`).join(', ')}
                </Text>
              </View>
            ))
          )}
        </View>

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
  logoutButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
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
    marginBottom: 8,
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F97316',
  },
  customerInfo: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  orderItems: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
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
});