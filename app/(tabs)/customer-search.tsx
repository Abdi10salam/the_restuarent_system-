// app/(tabs)/customer
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Search, User, Mail, CreditCard, ShoppingBag, Hash } from 'lucide-react-native';
import { searchCustomerByNumber } from '../lib/customer-helpers';
import { formatCurrency } from '../../utils/currency';
import { useRouter } from 'expo-router';
import { Customer } from '../../types';

export default function CustomerSearchScreen() {
  const router = useRouter();
  const [searchNumber, setSearchNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);

  const handleSearch = async () => {
    if (!searchNumber) {
      Alert.alert('Error', 'Please enter a customer number');
      return;
    }

    const number = parseInt(searchNumber);
    if (isNaN(number)) {
      Alert.alert('Error', 'Please enter a valid number');
      return;
    }

    setIsSearching(true);

    try {
      const customer = await searchCustomerByNumber(number);
      
      if (customer) {
        setFoundCustomer(customer);
      } else {
        Alert.alert('Not Found', `No customer found with number ${searchNumber}`);
        setFoundCustomer(null);
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // 🆕 FIX: Proper navigation with customer context
  const handlePlaceOrder = () => {
    if (!foundCustomer) return;
    
    console.log('🛒 Navigating to menu for customer:', foundCustomer.name);
    console.log('Customer ID:', foundCustomer.id);
    console.log('Customer Email:', foundCustomer.email);
    
    // Navigate to menu with customer context
    router.push({
      pathname: '/(tabs)',
      params: {
        orderType: 'for-customer',
        customerId: foundCustomer.id,
        customerName: foundCustomer.name,
        customerEmail: foundCustomer.email,
        customerNumber: foundCustomer.customerNumber.toString(),
        paymentType: foundCustomer.paymentType,
      }
    });
  };

  const handleClear = () => {
    setSearchNumber('');
    setFoundCustomer(null);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Customer Search</Text>
        <Text style={styles.subtitle}>Search by customer number</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={styles.inputContainer}>
          <Hash size={20} color="#10B981" strokeWidth={2} />
          <TextInput
            style={styles.input}
            placeholder="Enter customer number (e.g., 17)"
            value={searchNumber}
            onChangeText={setSearchNumber}
            keyboardType="numeric"
            maxLength={5}
            editable={!isSearching}
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.searchButton, isSearching && styles.disabledButton]}
            onPress={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Search size={20} color="#fff" strokeWidth={2} />
                <Text style={styles.searchButtonText}>Search</Text>
              </>
            )}
          </TouchableOpacity>

          {(searchNumber || foundCustomer) && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClear}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Customer Result */}
      {foundCustomer && (
        <View style={styles.resultSection}>
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.avatarContainer}>
                <User size={32} color="#10B981" strokeWidth={2} />
              </View>
              <View style={styles.customerNumberBadge}>
                <Text style={styles.customerNumberText}>#{foundCustomer.customerNumber}</Text>
              </View>
            </View>

            <Text style={styles.customerName}>{foundCustomer.name}</Text>

            <View style={styles.infoRow}>
              <Mail size={16} color="#6B7280" strokeWidth={2} />
              <Text style={styles.infoText}>{foundCustomer.email}</Text>
            </View>

            <View style={styles.infoRow}>
              <CreditCard size={16} color="#6B7280" strokeWidth={2} />
              <Text style={styles.infoText}>
                {foundCustomer.paymentType === 'monthly' ? 'Monthly Billing' : 'Cash Only'}
              </Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <ShoppingBag size={16} color="#10B981" strokeWidth={2} />
                <Text style={styles.statLabel}>Total Spent</Text>
                <Text style={styles.statValue}>{formatCurrency(foundCustomer.totalSpent)}</Text>
              </View>

              {foundCustomer.paymentType === 'monthly' && foundCustomer.monthlyBalance > 0 && (
                <View style={styles.statItem}>
                  <CreditCard size={16} color="#F59E0B" strokeWidth={2} />
                  <Text style={styles.statLabel}>Balance</Text>
                  <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                    {formatCurrency(foundCustomer.monthlyBalance)}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.placeOrderButton}
              onPress={handlePlaceOrder}
            >
              <ShoppingBag size={20} color="#fff" strokeWidth={2} />
              <Text style={styles.placeOrderButtonText}>Place Order for Customer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Instructions */}
      {!foundCustomer && !isSearching && (
        <View style={styles.instructionsCard}>
          <Search size={48} color="#D1D5DB" strokeWidth={1.5} />
          <Text style={styles.instructionsTitle}>How to Search</Text>
          <Text style={styles.instructionsText}>
            1. Ask the customer for their number{'\n'}
            2. Enter the number in the search box{'\n'}
            3. Tap Search to find their account{'\n'}
            4. Place an order on their behalf
          </Text>
        </View>
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
  searchSection: {
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#10B981',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  searchButton: {
    flex: 1,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 24,
    justifyContent: 'center',
    borderRadius: 12,
  },
  clearButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  resultSection: {
    padding: 16,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerNumberBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  customerNumberText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  customerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 4,
  },
  placeOrderButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  placeOrderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    margin: 16,
    alignItems: 'center',
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 24,
    textAlign: 'center',
  },
});