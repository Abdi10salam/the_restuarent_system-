// app/(admin)/overdue-bills.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { AlertTriangle, Clock, Mail, Phone, Calendar, ChevronRight, DollarSign } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/currency';
import {
  calculateOverdueBills,
  getOverdueSeverity,
  getOverdueSeverityColor,
  formatDaysOverdue,
} from '../../utils/payment-calculations';

export default function OverdueBillsScreen() {
  const { state, fetchOrdersFromSupabase, fetchCustomersFromSupabase } = useApp();
  const { orders, customers } = state;
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);

  const overdueData = useMemo(() => {
    return calculateOverdueBills(orders, customers);
  }, [orders, customers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchOrdersFromSupabase(),
      fetchCustomersFromSupabase(),
    ]);
    setRefreshing(false);
  };

  const handleSendReminder = (customer: any) => {
    Alert.alert(
      'Send Payment Reminder',
      `Send reminder to ${customer.customer.name}?\n\nOverdue Amount: ${formatCurrency(customer.overdueAmount)}\nOverdue Since: ${formatDaysOverdue(customer.daysOverdue)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Reminder',
          onPress: () => {
            // TODO: Implement email/SMS reminder
            Alert.alert('Success', 'Payment reminder sent!');
          },
        },
      ]
    );
  };

  const toggleExpand = (customerId: string) => {
    setExpandedCustomerId(expandedCustomerId === customerId ? null : customerId);
  };

  // Group by severity
  const customersBySeverity = useMemo(() => {
    const grouped = {
      critical: overdueData.customersWithOverdue.filter(c => getOverdueSeverity(c.daysOverdue) === 'critical'),
      high: overdueData.customersWithOverdue.filter(c => getOverdueSeverity(c.daysOverdue) === 'high'),
      medium: overdueData.customersWithOverdue.filter(c => getOverdueSeverity(c.daysOverdue) === 'medium'),
      low: overdueData.customersWithOverdue.filter(c => getOverdueSeverity(c.daysOverdue) === 'low'),
    };
    return grouped;
  }, [overdueData]);

  //@ts-ignore
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EF4444']} />
        }
      >
        {/* Summary Header */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIconContainer}>
              <AlertTriangle size={32} color="#EF4444" strokeWidth={2.5} />
            </View>
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentBadgeText}>ACTION REQUIRED</Text>
            </View>
          </View>

          <Text style={styles.summaryLabel}>Total Overdue Bills</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(overdueData.totalOverdueBills)}</Text>

          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>{overdueData.totalCustomers}</Text>
              <Text style={styles.summaryStatLabel}>Customers</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>
                {overdueData.customersWithOverdue.reduce((sum, c) => sum + c.orders.length, 0)}
              </Text>
              <Text style={styles.summaryStatLabel}>Orders</Text>
            </View>
          </View>
        </View>

        {/* Severity Breakdown */}
        {overdueData.totalCustomers > 0 && (
          <View style={styles.severityCard}>
            <Text style={styles.severityTitle}>Severity Breakdown</Text>
            <View style={styles.severityGrid}>
              {customersBySeverity.critical.length > 0 && (
                <View style={[styles.severityItem, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.severityCount, { color: '#DC2626' }]}>
                    {customersBySeverity.critical.length}
                  </Text>
                  <Text style={[styles.severityLabel, { color: '#DC2626' }]}>Critical (90+ days)</Text>
                </View>
              )}
              {customersBySeverity.high.length > 0 && (
                <View style={[styles.severityItem, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.severityCount, { color: '#EF4444' }]}>
                    {customersBySeverity.high.length}
                  </Text>
                  <Text style={[styles.severityLabel, { color: '#EF4444' }]}>High (60-89 days)</Text>
                </View>
              )}
              {customersBySeverity.medium.length > 0 && (
                <View style={[styles.severityItem, { backgroundColor: '#FED7AA' }]}>
                  <Text style={[styles.severityCount, { color: '#F97316' }]}>
                    {customersBySeverity.medium.length}
                  </Text>
                  <Text style={[styles.severityLabel, { color: '#F97316' }]}>Medium (30-59 days)</Text>
                </View>
              )}
              {customersBySeverity.low.length > 0 && (
                <View style={[styles.severityItem, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.severityCount, { color: '#F59E0B' }]}>
                    {customersBySeverity.low.length}
                  </Text>
                  <Text style={[styles.severityLabel, { color: '#F59E0B' }]}>
                    Low (≤30 days)
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Customer List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overdue Customers</Text>

          {overdueData.customersWithOverdue.length === 0 ? (
            <View style={styles.emptyState}>
              <AlertTriangle size={64} color="#D1D5DB" strokeWidth={1} />
              <Text style={styles.emptyText}>No Overdue Bills! 🎉</Text>
              <Text style={styles.emptySubtext}>All customers are up to date with payments</Text>
            </View>
          ) : (
            overdueData.customersWithOverdue.map((customerData) => {
              const severity = getOverdueSeverity(customerData.daysOverdue);
              const severityColor = getOverdueSeverityColor(severity);
              const isExpanded = expandedCustomerId === customerData.customer.id;

              return (
                <View
                  key={customerData.customer.id}
                  style={[styles.customerCard, { borderLeftColor: severityColor }]}
                >
                  {/* Customer Header */}
                  <TouchableOpacity
                    style={styles.customerHeader}
                    onPress={() => toggleExpand(customerData.customer.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.customerHeaderLeft}>
                      <View style={styles.customerInfo}>
                        <Text style={styles.customerName}>{customerData.customer.name}</Text>
                        <View style={styles.customerNumberBadge}>
                          <Text style={styles.customerNumberText}>#{customerData.customer.customerNumber}</Text>
                        </View>
                      </View>

                      <View style={styles.customerContact}>
                        <Mail size={12} color="#6B7280" strokeWidth={2} />
                        <Text style={styles.customerEmail}>{customerData.customer.email}</Text>
                      </View>

                      {customerData.customer.phone && (
                        <View style={styles.customerContact}>
                          <Phone size={12} color="#6B7280" strokeWidth={2} />
                          <Text style={styles.customerPhone}>{customerData.customer.phone}</Text>
                        </View>
                      )}
                    </View>

                    <ChevronRight
                      size={20}
                      color="#6B7280"
                      strokeWidth={2}
                      style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                    />
                  </TouchableOpacity>

                  {/* Overdue Summary */}
                  <View style={styles.overdueInfo}>
                    <View style={styles.overdueAmountContainer}>
                      <DollarSign size={20} color={severityColor} strokeWidth={2} />
                      <Text style={[styles.overdueAmount, { color: severityColor }]}>
                        {formatCurrency(customerData.overdueAmount)}
                      </Text>
                    </View>

                    <View style={[styles.severityBadge, { backgroundColor: `${severityColor}20` }]}>
                      <Clock size={12} color={severityColor} strokeWidth={2} />
                      <Text style={[styles.severityBadgeText, { color: severityColor }]}>
                        {formatDaysOverdue(customerData.daysOverdue)} overdue
                      </Text>
                    </View>
                  </View>

                  {/* Expanded Orders */}
                  {isExpanded && (
                    <View style={styles.expandedSection}>
                      <View style={styles.ordersHeader}>
                        <Calendar size={14} color="#6B7280" strokeWidth={2} />
                        <Text style={styles.ordersHeaderText}>
                          {customerData.orders.length} overdue order{customerData.orders.length !== 1 ? 's' : ''}
                        </Text>
                      </View>

                      {customerData.orders.map((order) => {
                        const orderDate = new Date(order.createdAt);
                        const daysAgo = Math.floor(
                          (new Date().getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
                        );

                        return (
                          <View key={order.id} style={styles.orderRow}>
                            <View style={styles.orderLeft}>
                              <Text style={styles.orderId}>#{order.id.slice(-6)}</Text>
                              <Text style={styles.orderDate}>
                                {orderDate.toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </Text>
                              <Text style={styles.orderDaysAgo}>{daysAgo} days ago</Text>
                            </View>
                            <Text style={styles.orderAmount}>{formatCurrency(order.totalAmount)}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* Action Button */}
                  <TouchableOpacity
                    style={[styles.reminderButton, { backgroundColor: severityColor }]}
                    onPress={() => handleSendReminder(customerData)}
                  >
                    <Mail size={18} color="#fff" strokeWidth={2} />
                    <Text style={styles.reminderButtonText}>Send Payment Reminder</Text>
                  </TouchableOpacity>
                </View>
              );
            })
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
  scrollContent: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderLeftWidth: 6,
    borderLeftColor: '#EF4444',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryIconContainer: {
    backgroundColor: '#FEE2E2',
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgentBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  urgentBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  summaryStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  severityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  severityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  severityGrid: {
    gap: 8,
  },
  severityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
  },
  severityCount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  severityLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  customerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerHeaderLeft: {
    flex: 1,
    gap: 6,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  customerNumberBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  customerNumberText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  customerContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerEmail: {
    fontSize: 13,
    color: '#6B7280',
  },
  customerPhone: {
    fontSize: 13,
    color: '#6B7280',
  },
  overdueInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  overdueAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  overdueAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  severityBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  expandedSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  ordersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  ordersHeaderText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  orderLeft: {
    gap: 2,
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  orderDaysAgo: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  reminderButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 48,
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
    height: 20,
  },
});