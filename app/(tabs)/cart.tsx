import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ShoppingBag, CreditCard, Calendar } from 'lucide-react-native';
import { CartItem } from '../../components/CartItem';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export default function CartScreen() {
  const { state: appState, dispatch } = useApp();
  const { state: authState } = useAuth();
  const { cart } = appState;

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.dish.price * item.quantity,
    0
  );

  const handleUpdateQuantity = (dishId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', dishId, quantity });
  };

  const handleRemoveItem = (dishId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', dishId });
  };

  const handlePlaceOrder = (paymentType: 'cash' | 'monthly') => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before placing an order.');
      return;
    }

    if (!authState.currentUser) {
      Alert.alert('Error', 'User not found');
      return;
    }

    dispatch({ 
      type: 'PLACE_ORDER', 
      customerId: authState.currentUser.id,
      customerName: authState.currentUser.name,
      customerEmail: authState.currentUser.email,
      paymentType 
    });
    
    const paymentMessage = paymentType === 'cash' 
      ? 'Your order has been placed with cash payment. Please pay at the counter.'
      : 'Your order has been added to your monthly bill.';
    
    Alert.alert('Order Placed', paymentMessage);
  };

  if (cart.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Cart</Text>
          <Text style={styles.subtitle}>Add items from the menu</Text>
        </View>
        
        <View style={styles.emptyContainer}>
          <ShoppingBag size={64} color="#D1D5DB" strokeWidth={1} />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <Text style={styles.emptySubtext}>Browse our menu to add delicious dishes</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Cart</Text>
        <Text style={styles.subtitle}>{cart.length} item{cart.length !== 1 ? 's' : ''}</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {cart.map((item, index) => (
          <CartItem
            key={index}
            item={item}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={handleRemoveItem}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>${totalAmount.toFixed(2)}</Text>
        </View>
        
        <View style={styles.paymentButtons}>
          <TouchableOpacity
            style={[styles.paymentButton, styles.cashButton]}
            onPress={() => handlePlaceOrder('cash')}
          >
            <CreditCard size={20} color="#fff" strokeWidth={2} />
            <Text style={styles.cashButtonText}>Pay Cash</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.paymentButton, styles.monthlyButton]}
            onPress={() => handlePlaceOrder('monthly')}
          >
            <Calendar size={20} color="#10B981" strokeWidth={2} />
            <Text style={styles.monthlyButtonText}>Monthly Bill</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    paddingBottom: 200,
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 24,
    paddingBottom: 34,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F97316',
  },
  paymentButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  cashButton: {
    backgroundColor: '#F97316',
  },
  cashButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  monthlyButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  monthlyButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: 'bold',
  },
});