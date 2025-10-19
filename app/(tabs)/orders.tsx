import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';
import { OrderStatusCard } from '../../components/OrderStatusCard';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrdersScreen() {
  const { state } = useApp();
  const { state: authState } = useAuth();
  const { orders } = state;
  

  // Filter orders for current customer only
  const customerOrders = orders.filter(order => order.customerId === authState.currentUser?.id);

  if (customerOrders.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Order Status</Text>
          <Text style={styles.subtitle}>Track your orders here</Text>
        </View>
        
        <View style={styles.emptyContainer}>
          <Clock size={64} color="#D1D5DB" strokeWidth={1} />
          <Text style={styles.emptyText}>No orders yet</Text>
          <Text style={styles.emptySubtext}>Place your first order from the menu</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FF0000' }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Order Status</Text>
          <Text style={styles.subtitle}>{customerOrders.length} order{customerOrders.length !== 1 ? 's' : ''}</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {customerOrders.map((order) => (
          <OrderStatusCard key={order.id} order={order} />
        ))}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
     </SafeAreaView>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 20,
  },
});