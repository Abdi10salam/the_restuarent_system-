import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { CartItem as CartItemType } from '../types';
import { formatCurrency } from '../utils/currency';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (dishId: string, quantity: number) => void;
  onRemove: (dishId: string) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const itemTotal = item.dish.price * item.quantity;

  return (
    <View style={styles.container}>
      <Image source={{ uri: item.dish.image }} style={styles.image} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.info}>
            <Text style={styles.name}>{item.dish.name}</Text>
            <Text style={styles.category}>{item.dish.category}</Text>
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(item.dish.id)}
          >
            <Trash2 size={18} color="#EF4444" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => onUpdateQuantity(item.dish.id, item.quantity - 1)}
            >
              <Minus size={16} color="#6B7280" strokeWidth={2} />
            </TouchableOpacity>
            
            <Text style={styles.quantity}>{item.quantity}</Text>
            
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => onUpdateQuantity(item.dish.id, item.quantity + 1)}
            >
              <Plus size={16} color="#6B7280" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>{formatCurrency(item.dish.price)} each</Text>
            <Text style={styles.totalPrice}>{formatCurrency(itemTotal)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 18,
    marginBottom: 12,
    padding: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  image: {
    width: 74,
    height: 74,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#EEF2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  removeButton: {
    padding: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7F4',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  quantity: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D97706',
  },
});
