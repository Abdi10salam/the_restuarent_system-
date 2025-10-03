import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Clock, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';

export default function AdminOrdersScreen() {
  const { state, dispatch } = useApp();
  const { orders } = state;

  const handleApproveOrder = (orderId: string) => {
    Alert.alert(
      'Approve Order',
      'Are you sure you want to approve this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => dispatch({ type: 'UPDATE_ORDER_STATUS', orderId, status: 'approved' }),
        },
      ]
    );
  };

  const handleRejectOrder = (orderId: string) => {
    Alert.alert(
      'Reject Order',
      'Are you sure you want to reject this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => dispatch({ type: 'UPDATE_ORDER_STATUS', orderId, status: 'rejected' }),
        },
      ]
    );
  };

  const pendingOrders = orders.filter(order => order.status === 'pending');
  const completedOrders = orders.filter(order => order.status !== 'pending');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order Management</Text>
        <Text style={styles.subtitle}>
          {pendingOrders.length} pending • {completedOrders.length} completed
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Pending Orders */}
        {pendingOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Approval</Text>
            {pendingOrders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={styles.statusContainer}>
                    <Clock size={20} color="#F59E0B" strokeWidth={2} />
                    <Text style={styles.orderId}>#{order.id.slice(-6)}</Text>
                  </View>
                  <Text style={styles.orderAmount}>${order.totalAmount.toFixed(2)}</Text>
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
                
                <Text style={styles.paymentType}>
                  Payment: {order.paymentType === 'cash' ? 'Cash' : 'Monthly Billing'}
                </Text>

                <View style={styles.items}>
                  {order.items.map((item, index) => (
                    <Text key={index} style={styles.itemText}>
                      {item.quantity}x {item.dish.name} - ${(item.dish.price * item.quantity).toFixed(2)}
                    </Text>
                  ))}
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleRejectOrder(order.id)}
                  >
                    <XCircle size={18} color="#fff" strokeWidth={2} />
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => handleApproveOrder(order.id)}
                  >
                    <CheckCircle size={18} color="#fff" strokeWidth={2} />
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Completed Orders */}
        {completedOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Completed Orders</Text>
            {completedOrders.slice(0, 10).map((order) => (
              <View key={order.id} style={styles.completedOrderCard}>
                <View style={styles.orderHeader}>
                  <View style={styles.statusContainer}>
                    {order.status === 'approved' ? (
                      <CheckCircle size={20} color="#10B981" strokeWidth={2} />
                    ) : (
                      <XCircle size={20} color="#EF4444" strokeWidth={2} />
                    )}
                    <Text style={styles.orderId}>#{order.id.slice(-6)}</Text>
                  </View>
                  <Text style={styles.orderAmount}>${order.totalAmount.toFixed(2)}</Text>
                </View>
                
                <Text style={styles.customerInfo}>
                  Customer: {order.customerName}
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
            ))}
          </View>
        )}

        {orders.length === 0 && (
          <View style={styles.emptyState}>
            <Clock size={64} color="#D1D5DB" strokeWidth={1} />
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySubtext}>Orders from customers will appear here</Text>
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
  header: {
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  completedOrderCard: {
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F97316',
  },
  customerInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  paymentType: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  items: {
    marginBottom: 16,
  },
  itemText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  orderItems: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  rejectButtonText: {
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
});