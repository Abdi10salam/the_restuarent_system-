// app/(tabs)/reception-dashboard.tsx - FIXED VERSION
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { LayoutDashboard, ShoppingBag, CheckCircle, DollarSign, Clock, Search, UserPlus } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useRouter } from 'expo-router';
import { formatCurrency } from '../../utils/currency';

export default function ReceptionDashboardScreen() {
  const { state: authState } = useAuth();
  const { state: appState, fetchOrdersFromSupabase } = useApp();
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);

  const { orders } = appState;

  // 🆕 FIX: Better date comparison (ignores time)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  
  const todayOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    orderDate.setHours(0, 0, 0, 0); // Start of order day
    return orderDate.getTime() === today.getTime();
  });
  
  console.log('📊 Dashboard Debug:');
  console.log('Total orders in system:', orders.length);
  console.log('Today\'s orders:', todayOrders.length);
  
  const pendingOrders = todayOrders.filter(o => o.status === 'pending');
  const completedOrders = todayOrders.filter(o => o.status === 'approved');
  const todayRevenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  
  console.log('Pending:', pendingOrders.length);
  console.log('Completed:', completedOrders.length);
  console.log('Revenue:', todayRevenue);
  
  // Recent orders (last 5)
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrdersFromSupabase();
    setRefreshing(false);
  };

  // 🆕 NEW: Navigate to menu for walk-in order
  const handleWalkInOrder = () => {
    console.log('🚶 Starting walk-in order flow');
    // Navigate to menu with walk-in context
    router.push({
      pathname: '/(tabs)',
      params: { orderType: 'walk-in' }
    });
  };

  // 🆕 NEW: Navigate to customer search
  const handleSearchCustomer = () => {
    console.log('🔍 Opening customer search');
    router.push('/(tabs)/customer-search');
  };

  // 🆕 NEW: Navigate to pending orders
  const handlePendingOrders = () => {
    console.log('✅ Opening pending orders');
    router.push('/(tabs)/pending-orders');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Reception Dashboard</Text>
          <Text style={styles.subtitle}>Welcome, {authState.currentUser?.name}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>STAFF</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />
        }
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleSearchCustomer}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Search size={24} color="#3B82F6" strokeWidth={2} />
              </View>
              <Text style={styles.actionText}>Search Customer</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleWalkInOrder}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                <UserPlus size={24} color="#F59E0B" strokeWidth={2} />
              </View>
              <Text style={styles.actionText}>Walk-in Order</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handlePendingOrders}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
                <CheckCircle size={24} color="#10B981" strokeWidth={2} />
              </View>
              <Text style={styles.actionText}>Approve Orders</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
              <Clock size={20} color="#F59E0B" strokeWidth={2} />
              <Text style={styles.statValue}>{pendingOrders.length}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>

            <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
              <CheckCircle size={20} color="#10B981" strokeWidth={2} />
              <Text style={styles.statValue}>{completedOrders.length}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>

            <View style={[styles.statCard, { borderLeftColor: '#3B82F6' }]}>
              <DollarSign size={20} color="#3B82F6" strokeWidth={2} />
              <Text style={styles.statValue}>{formatCurrency(todayRevenue)}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={handlePendingOrders}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <ShoppingBag size={48} color="#D1D5DB" strokeWidth={1.5} />
              <Text style={styles.emptyText}>No orders yet today</Text>
              <Text style={styles.emptySubtext}>Orders will appear here as they come in</Text>
            </View>
          ) : (
            recentOrders.map((order) => (
              <TouchableOpacity 
                key={order.id} 
                style={styles.orderCard}
                onPress={handlePendingOrders}
              >
                <View style={styles.orderHeader}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderId}>#{order.id.slice(-6)}</Text>
                    {order.isWalkIn && (
                      <View style={styles.walkInBadge}>
                        <Text style={styles.walkInText}>Walk-in</Text>
                      </View>
                    )}
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: 
                      order.status === 'pending' ? '#FEF3C7' : 
                      order.status === 'approved' ? '#D1FAE5' : '#FEE2E2' 
                    }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: 
                        order.status === 'pending' ? '#F59E0B' : 
                        order.status === 'approved' ? '#10B981' : '#EF4444' 
                      }
                    ]}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.customerName}>{order.customerName}</Text>
                <Text style={styles.orderTime}>
                  {new Date(order.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
                <Text style={styles.orderAmount}>{formatCurrency(order.totalAmount)}</Text>
              </TouchableOpacity>
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
  badge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
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
    color: '#10B981',
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
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
    marginBottom: 8,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  walkInBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  walkInText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  customerName: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 100,
  },
});