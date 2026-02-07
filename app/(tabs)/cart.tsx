import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { CreditCard, Calendar } from 'lucide-react-native';
import { CartItem } from '../../components/CartItem';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Order } from '../../types';
import { formatCurrency } from '../../utils/currency';

export default function CartScreen() {
  const { state: appState, dispatch, placeOrderToSupabase } = useApp();
  const { state: authState } = useAuth();
  const { cart } = appState;
  
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

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

  const handlePlaceOrder = async (paymentType: 'cash' | 'monthly') => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before placing an order.');
      return;
    }

    if (!authState.currentUser) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setIsPlacingOrder(true);

    try {
      // Create order object
      const newOrder: Order = {
        id: Date.now().toString(),
        customerId: authState.currentUser.id,
        customerName: authState.currentUser.name,
        customerEmail: authState.currentUser.email,
        items: [...cart],
        totalAmount,
        status: 'pending',
        paymentType,
        createdAt: new Date().toISOString(),
      };

      // 🔥 Save order to Supabase
      await placeOrderToSupabase(newOrder);

      // Clear local cart
      dispatch({ type: 'CLEAR_CART' });

      const paymentMessage = paymentType === 'cash' 
        ? 'Your order has been placed with cash payment. Please pay at the counter.'
        : 'Your order has been added to your monthly bill.';
      
      Alert.alert('Order Placed Successfully! 🎉', paymentMessage);
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (cart.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Cart</Text>
          <Text style={styles.subtitle}>Add items from the menu</Text>
        </View>
        
        <View style={styles.emptyContainer}>
          <Image
            source={require("../../assets/images/no_dish.png")}
            style={styles.emptyIcon}
            resizeMode="contain"
          />
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
          <View>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalHint}>Taxes included</Text>
          </View>
          <Text style={styles.totalAmount}>{formatCurrency(totalAmount)}</Text>
        </View>
        
        <View style={styles.paymentButtons}>
          <TouchableOpacity
            style={[styles.paymentButton, styles.cashButton, isPlacingOrder && styles.disabledButton]}
            onPress={() => handlePlaceOrder('cash')}
            disabled={isPlacingOrder}
          >
            {isPlacingOrder ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <CreditCard size={20} color="#fff" strokeWidth={2} />
                <Text style={styles.cashButtonText}>Pay Cash</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.paymentButton, styles.monthlyButton, isPlacingOrder && styles.disabledButton]}
            onPress={() => handlePlaceOrder('monthly')}
            disabled={isPlacingOrder}
          >
            {isPlacingOrder ? (
              <ActivityIndicator color="#3B5D4F" size="small" />
            ) : (
              <>
                <Calendar size={20} color="#3B5D4F" strokeWidth={2} />
                <Text style={styles.monthlyButtonText}>Monthly Bill</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F3EE',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
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
    paddingTop: 8,
    paddingBottom: 200,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    marginBottom: 12,
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    padding: 20,
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
  totalHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D97706',
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
    borderRadius: 14,
    gap: 8,
  },
  cashButton: {
    backgroundColor: '#3B5D4F',
  },
  cashButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  monthlyButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3B5D4F',
  },
  monthlyButtonText: {
    color: '#3B5D4F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
