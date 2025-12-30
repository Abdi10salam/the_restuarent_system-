import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Receipt, DollarSign, Calendar, FileText, LogOut } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
  const { state: appState } = useApp();
  const { state: authState, logout } = useAuth();
  const router = useRouter(); // Keep this import
  const { orders } = appState;
  
  const user = authState.currentUser; 

  if (!user) {
    // This guard clause is ESSENTIAL and remains here
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text style={{ marginTop: 10, color: '#6B7280' }}>Logging out...</Text>
      </View>
    );
  }

  // All code below this line is now safe because 'user' is guaranteed to exist.
  const userOrders = orders.filter(order => order.customerId === user.id);
  const completedOrders = userOrders.filter(order => order.status === 'approved');
  const monthlyOrders = completedOrders.filter(order => order.paymentType === 'monthly');
  const totalSpent = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  const generateMonthlyInvoice = () => {
    const currentMonth = new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    return {
      month: currentMonth,
      orders: monthlyOrders,
      totalAmount: user.monthlyBalance,
    };
  };

  const invoice = generateMonthlyInvoice();

  const handleLogout = () => {
    // ✅ RE-FIX: Call logout AND explicitly navigate.
    // This provides immediate feedback for the on-screen button.
    logout();
    router.replace('/portal-selection'); 
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Welcome back, {user.name}</Text>
        </View>
        
        {/* The on-screen LogOut button MUST have an onPress handler */}
        <TouchableOpacity style={styles.logoutIconWrapper} onPress={handleLogout}>
          <LogOut size={20} color="#6B7280" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoCard}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        </View>

        {/* Monthly Balance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Balance</Text>
          <View style={styles.balanceCard}>
            <DollarSign size={24} color="#F97316" strokeWidth={2} />
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceAmount}>${user.monthlyBalance.toFixed(2)}</Text>
              <Text style={styles.balanceLabel}>Outstanding Balance</Text>
            </View>
          </View>
        </View>

        {/* Current Month Invoice */}
        {user.monthlyBalance > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Month Invoice</Text>
            <View style={styles.invoiceCard}>
              <View style={styles.invoiceHeader}>
                <Calendar size={20} color="#6B7280" strokeWidth={2} />
                <Text style={styles.invoiceMonth}>{invoice.month}</Text>
                <Text style={styles.invoiceTotal}>${invoice.totalAmount.toFixed(2)}</Text>
              </View>
              
              {invoice.orders.map((order, index) => (
                <View key={index} style={styles.invoiceItem}>
                  <Text style={styles.invoiceDate}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </Text>
                  <Text style={styles.invoiceOrderId}>#{order.id.slice(-6)}</Text>
                  <Text style={styles.invoiceAmount}>${order.totalAmount.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Order History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order History</Text>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Receipt size={24} color="#F97316" strokeWidth={2} />
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>{completedOrders.length}</Text>
                <Text style={styles.statLabel}>Completed Orders</Text>
              </View>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <FileText size={24} color="#10B981" strokeWidth={2} />
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>${totalSpent.toFixed(2)}</Text>
                <Text style={styles.statLabel}>Total Spent</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Orders */}
        {completedOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            {completedOrders.slice(0, 3).map((order) => (
              <View key={order.id} style={styles.recentOrderCard}>
                <View style={styles.recentOrderHeader}>
                  <Text style={styles.recentOrderId}>#{order.id.slice(-6)}</Text>
                  <Text style={styles.recentOrderDate}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </Text>
                  <Text style={styles.recentOrderAmount}>
                    ${order.totalAmount.toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.recentOrderItems}>
                  {order.items.map(item => `${item.quantity}x ${item.dish.name}`).join(', ')}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Added new style for the loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  // Added wrapper style for the LogOut icon
  logoutIconWrapper: {
    padding: 8,
  },
  // Removed unused 'logoutButton' style
  
  // ... (All existing styles below here) ...
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
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6B7280',
  },
  balanceCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceInfo: {
    marginLeft: 16,
    flex: 1,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  invoiceCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  invoiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  invoiceMonth: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  invoiceTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F97316',
  },
  invoiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  invoiceDate: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  invoiceOrderId: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    textAlign: 'center',
  },
  invoiceAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  recentOrderCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recentOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentOrderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  recentOrderDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  recentOrderAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F97316',
  },
  recentOrderItems: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  bottomPadding: {
    height: 20,
  },
});