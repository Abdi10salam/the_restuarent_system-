import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { CheckSquare, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/currency';

export default function PendingOrdersScreen() {
  const { state, updateOrderStatusInSupabase, fetchOrdersFromSupabase } = useApp();
  const { orders, isLoading } = state;
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const pendingOrders = orders.filter(order => order.status === 'pending');
  const recentCompleted = orders
    .filter(order => order.status !== 'pending')
    .slice(0, 10);

  const handleApprove = (orderId: string) => {
    Alert.alert(
      'Approve Order',
      'Approve this order and notify customer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setProcessingOrderId(orderId);
            try {
              await updateOrderStatusInSupabase(orderId, 'approved');
              Alert.alert('Success', 'Order approved! ✅');
            } catch (error) {
              Alert.alert('Error', 'Failed to approve order');
            } finally {
              setProcessingOrderId(null);
            }
          }
        }
      ]
    );
  };

  const handleReject = (orderId: string) => {
    Alert.alert(
      'Reject Order',
      'Are you sure you want to reject this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setProcessingOrderId(orderId);
            try {
              await updateOrderStatusInSupabase(orderId, 'rejected');
              Alert.alert('Order Rejected', 'The order has been rejected');
            } catch (error) {
              Alert.alert('Error', 'Failed to reject order');
            } finally {
              setProcessingOrderId(null);
            }
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrdersFromSupabase();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Approve Orders</Text>
          <Text style={styles.subtitle}>
            {pendingOrders.length} pending • {recentCompleted.length} completed
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={isLoading || refreshing}
        >
          <RefreshCw size={20} color="#10B981" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />
          }
        >
          {/* Pending Orders */}
          {pendingOrders.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⏳ Pending Approval</Text>
              {pendingOrders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View style={styles.headerLeft}>
                      <Clock size={20} color="#F59E0B" strokeWidth={2} />
                      <Text style={styles.orderId}>#{order.id.slice(-6)}</Text>
                      {order.isWalkIn && (
                        <View style={styles.walkInBadge}>
                          <Text style={styles.walkInText}>Walk-in</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.orderAmount}>{formatCurrency(order.totalAmount)}</Text>
                  </View>

                  <Text style={styles.customerName}>{order.customerName}</Text>
                  <Text style={styles.customerEmail}>{order.customerEmail}</Text>
                  
                  <Text style={styles.orderTime}>
                    {new Date(order.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>

                  <Text style={styles.paymentType}>
                    Payment: {order.paymentType === 'cash' ? 'Cash' : 'Monthly Billing'}
                  </Text>

                  {/* Order Items */}
                  <View style={styles.itemsSection}>
                    <Text style={styles.itemsTitle}>Items:</Text>
                    {order.items.map((item, index) => (
                      <View key={index} style={styles.itemRow}>
                        <Text style={styles.itemText}>
                          {item.quantity}x {item.dish.name}
                        </Text>
                        <Text style={styles.itemPrice}>
                          {formatCurrency(item.dish.price * item.quantity)}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[
                        styles.rejectButton,
                        processingOrderId === order.id && styles.disabledButton
                      ]}
                      onPress={() => handleReject(order.id)}
                      disabled={processingOrderId === order.id}
                    >
                      {processingOrderId === order.id ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <XCircle size={18} color="#fff" strokeWidth={2} />
                          <Text style={styles.rejectButtonText}>Reject</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.approveButton,
                        processingOrderId === order.id && styles.disabledButton
                      ]}
                      onPress={() => handleApprove(order.id)}
                      disabled={processingOrderId === order.id}
                    >
                      {processingOrderId === order.id ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <CheckCircle size={18} color="#fff" strokeWidth={2} />
                          <Text style={styles.approveButtonText}>Approve</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Completed Orders */}
          {recentCompleted.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✅ Recent Completed</Text>
              {recentCompleted.map((order) => (
                <View key={order.id} style={styles.completedOrderCard}>
                  <View style={styles.orderHeader}>
                    <View style={styles.headerLeft}>
                      {order.status === 'approved' ? (
                        <CheckCircle size={20} color="#10B981" strokeWidth={2} />
                      ) : (
                        <XCircle size={20} color="#EF4444" strokeWidth={2} />
                      )}
                      <Text style={styles.orderId}>#{order.id.slice(-6)}</Text>
                    </View>
                    <Text style={styles.orderAmount}>{formatCurrency(order.totalAmount)}</Text>
                  </View>

                  <Text style={styles.customerName}>{order.customerName}</Text>
                  
                  <Text style={styles.orderTime}>
                    {new Date(order.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>

                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: order.status === 'approved' ? '#D1FAE5' : '#FEE2E2' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: order.status === 'approved' ? '#10B981' : '#EF4444' }
                    ]}>
                      {order.status === 'approved' ? 'Approved' : 'Rejected'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Empty State */}
          {pendingOrders.length === 0 && recentCompleted.length === 0 && (
            <View style={styles.emptyState}>
              <CheckSquare size={64} color="#D1D5DB" strokeWidth={1.5} />
              <Text style={styles.emptyText}>No orders to review</Text>
              <Text style={styles.emptySubtext}>
                Pending orders will appear here for approval
              </Text>
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
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
  refreshButton: {
    backgroundColor: '#D1FAE5',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  completedOrderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
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
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 16,
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
  orderAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  customerEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  orderTime: {
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
  itemsSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  itemsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemText: {
    fontSize: 14,
    color: '#4B5563',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
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
  disabledButton: {
    opacity: 0.6,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 48,
    margin: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 100,
  },
});