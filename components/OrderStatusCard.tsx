import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react-native';
import { Order } from '../types';

interface OrderStatusCardProps {
  order: Order;
}

export function OrderStatusCard({ order }: OrderStatusCardProps) {
  const getStatusIcon = () => {
    switch (order.status) {
      case 'pending':
        return <Clock size={24} color="#F59E0B" strokeWidth={2} />;
      case 'approved':
        return <CheckCircle size={24} color="#10B981" strokeWidth={2} />;
      case 'rejected':
        return <XCircle size={24} color="#EF4444" strokeWidth={2} />;
    }
  };

  const getStatusColor = () => {
    switch (order.status) {
      case 'pending':
        return '#F59E0B';
      case 'approved':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
    }
  };

  const getStatusText = () => {
    switch (order.status) {
      case 'pending':
        return 'Pending Approval';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statusContainer}>
          {getStatusIcon()}
          <Text style={[styles.status, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
        <Text style={styles.orderId}>Order #{order.id.slice(-6)}</Text>
      </View>
      
      <View style={styles.details}>
        <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
        <Text style={styles.paymentType}>
          {order.paymentType === 'cash' ? 'Cash Payment' : 'Monthly Billing'}
        </Text>
      </View>

      <View style={styles.items}>
        {order.items.map((item, index) => (
          <View key={index} style={styles.item}>
            <Text style={styles.itemName}>{item.dish.name}</Text>
            <Text style={styles.itemQuantity}>x{item.quantity}</Text>
            <Text style={styles.itemPrice}>
              ${(item.dish.price * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.total}>Total: ${order.totalAmount.toFixed(2)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  status: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  orderId: {
    fontSize: 14,
    color: '#6B7280',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  date: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentType: {
    fontSize: 14,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  items: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginBottom: 12,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 12,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  total: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
  },
});