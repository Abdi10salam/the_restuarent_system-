// app/(admin)/dashboard.tsx - WITH REAL-TIME UPDATES & AUTO-REFRESH
import React, { useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Receipt, AlertTriangle, CheckCircle, Users, TrendingUp, Calendar } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { formatCurrency } from '../../utils/currency';
import {
  calculateRevenue,
  calculateMonthlyBills,
  calculateOverdueBills,
  getCompletedOrdersCount,
  getActiveCustomersCount,
} from '../../utils/payment-calculations';

export default function AdminDashboardScreen() {
  const { state, fetchOrdersFromSupabase, fetchCustomersFromSupabase } = useApp();
  const { orders, customers } = state;
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);

  // Calculate all metrics using business logic
  const metrics = useMemo(() => {
    const revenue = calculateRevenue(orders, customers);
    const monthlyBills = calculateMonthlyBills(orders, customers);
    const overdueBills = calculateOverdueBills(orders, customers);
    const completedOrders = getCompletedOrdersCount(orders);
    const activeCustomers = getActiveCustomersCount(orders);

    return {
      revenue,
      monthlyBills,
      overdueBills,
      completedOrders,
      activeCustomers,
    };
  }, [orders, customers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchOrdersFromSupabase(),
      fetchCustomersFromSupabase(),
    ]);
    setRefreshing(false);
  };

  // 🆕 AUTO-REFRESH: Fetch latest data when dashboard gains focus
  useFocusEffect(
    useCallback(() => {
      console.log('📊 Dashboard focused - refreshing data...');
      fetchOrdersFromSupabase();
      fetchCustomersFromSupabase();
    }, [])
  );

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />
        }
      >
        {/* MAIN METRIC: Revenue - WITH INTERACTIVE SECTIONS */}
        <View style={styles.revenueCard}>
          {/* Top Section - Total Revenue (Tappable) */}
          <TouchableOpacity
            style={styles.revenueTopSection}
            onPress={() => router.push('/(admin)/revenue-details')}
            activeOpacity={0.8}
          >
            <View style={styles.revenueHeader}>
              <Text style={styles.revenueLabel}>💰 REVENUE</Text>
              <View style={styles.revenueTrend}>
                <TrendingUp size={16} color="#10B981" strokeWidth={2} />
                <Text style={styles.revenueTrendText}>This Month</Text>
              </View>
            </View>


            <Text style={styles.revenueAmount}>{formatCurrency(metrics.revenue.totalRevenue)}</Text>
            <Text style={styles.tapHintTop}>Tap to view all revenue →</Text>
          </TouchableOpacity>

          {/* Bottom Sections - Walk-in & Monthly Payments (Each Tappable) */}
          <View style={styles.revenueBreakdown}>
            {/* Walk-in Cash Section (Tappable) */}
            <TouchableOpacity
              style={styles.revenueBreakdownItem}
              onPress={() => {
                // TODO: Navigate to walk-in revenue details
                router.push({
                  pathname: '/(admin)/revenue-details',
                  params: { filter: 'walk-in' }
                });
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.revenueBreakdownLabel}>Walk-in Cash</Text>
              <Text style={styles.revenueBreakdownValue}>
                {formatCurrency(metrics.revenue.walkInRevenue)}
              </Text>
              <Text style={styles.tapHintSmall}>View details →</Text>
            </TouchableOpacity>

            <View style={styles.revenueBreakdownDivider} />

            {/* Monthly Payments Section (Tappable) */}
            <TouchableOpacity
              style={styles.revenueBreakdownItem}
              onPress={() => {
                // TODO: Navigate to monthly payments details
                router.push({
                  pathname: '/(admin)/revenue-details',
                  params: { filter: 'monthly' }
                });
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.revenueBreakdownLabel}>Monthly Payments</Text>
              <Text style={styles.revenueBreakdownValue}>
                {formatCurrency(metrics.revenue.monthlyPaymentsRevenue)}
              </Text>
              <Text style={styles.tapHintSmall}>View details →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bills Section - Side by Side */}
        <View style={styles.billsRow}>
          {/* Monthly Bills */}
          <TouchableOpacity
            style={[styles.billCard, styles.monthlyBillCard]}
            onPress={() => router.push('/(admin)/monthly-bills')}
            activeOpacity={0.8}
          >
            <Text style={styles.billLabel}>📋 MONTHLY BILLS</Text>
            <Text style={styles.billSubLabel}>(Current Month)</Text>
            <Text style={styles.billAmount}>{formatCurrency(metrics.monthlyBills.totalMonthlyBills)}</Text>
            <View style={styles.billFooter}>
              <Users size={14} color="#6B7280" strokeWidth={2} />
              <Text style={styles.billCustomerCount}>
                {metrics.monthlyBills.totalCustomers} customer{metrics.monthlyBills.totalCustomers !== 1 ? 's' : ''}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Overdue Bills */}
          <TouchableOpacity
            style={[styles.billCard, styles.overdueBillCard]}
            onPress={() => router.push('/(admin)/overdue-bills')}
            activeOpacity={0.8}>
            <Text style={styles.billLabel}>⚠️ OVERDUE BILLS</Text>
            <Text style={styles.billSubLabel}>(Previous Months)</Text>
            <Text style={styles.billAmount}>{formatCurrency(metrics.overdueBills.totalOverdueBills)}</Text>
            <View style={styles.billFooter}>
              <Users size={14} color="#6B7280" strokeWidth={2} />
              <Text style={styles.billCustomerCount}>
                {metrics.overdueBills.totalCustomers} customer{metrics.overdueBills.totalCustomers !== 1 ? 's' : ''}
              </Text>
            </View>
            {metrics.overdueBills.totalCustomers > 0 && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentBadgeText}>URGENT</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats Row - Completed Orders & Active Customers */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(admin)/orders')}
            activeOpacity={0.8}
          >
            <View style={styles.statIconContainer}>
              <CheckCircle size={28} color="#3B82F6" strokeWidth={2.5} />
            </View>
            <Text style={styles.statValue}>{metrics.completedOrders}</Text>
            <Text style={styles.statLabel}>✅ Completed Orders</Text>
            <Text style={styles.statSubLabel}>This Month</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(admin)/customers')}
            activeOpacity={0.8}
          >
            <View style={styles.statIconContainer}>
              <Users size={28} color="#8B5CF6" strokeWidth={2.5} />
            </View>
            <Text style={styles.statValue}>{metrics.activeCustomers}</Text>
            <Text style={styles.statLabel}>👥 Active Customers</Text>
            <Text style={styles.statSubLabel}>This Month</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Insights */}
        {metrics.overdueBills.totalCustomers > 0 && (
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <AlertTriangle size={20} color="#F59E0B" strokeWidth={2} />
              <Text style={styles.insightTitle}>Action Required</Text>
            </View>
            <Text style={styles.insightText}>
              {metrics.overdueBills.totalCustomers} customer{metrics.overdueBills.totalCustomers !== 1 ? 's have' : ' has'} overdue
              bills totaling {formatCurrency(metrics.overdueBills.totalOverdueBills)}.
              Consider sending payment reminders.
            </Text>
            <TouchableOpacity
              style={styles.insightButton}
              onPress={() => router.push('/(admin)/overdue-bills')}
            >
              <Text style={styles.insightButtonText}>View Overdue Bills</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Summary Stats */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Monthly Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={styles.summaryValue}>{formatCurrency(metrics.revenue.totalRevenue)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Outstanding (Current)</Text>
            <Text style={styles.summaryValue}>{formatCurrency(metrics.monthlyBills.totalMonthlyBills)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Outstanding (Overdue)</Text>
            <Text style={[styles.summaryValue, styles.summaryValueDanger]}>
              {formatCurrency(metrics.overdueBills.totalOverdueBills)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelBold}>Total Outstanding</Text>
            <Text style={styles.summaryValueBold}>
              {formatCurrency(metrics.monthlyBills.totalMonthlyBills + metrics.overdueBills.totalOverdueBills)}
            </Text>
          </View>
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
    paddingTop: 24,
  },
  headerSection: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  monthText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },

  // REVENUE CARD (Largest, Most Prominent) - WITH INTERACTIVE SECTIONS
  revenueCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderLeftWidth: 6,
    borderLeftColor: '#10B981',
    overflow: 'hidden',
  },
  revenueTopSection: {
    padding: 24,
    paddingBottom: 16,
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  revenueTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  revenueTrendText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10B981',
  },
  revenueLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
    marginBottom: 8,
  },
  revenueAmount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 8,
  },
  tapHintTop: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
    textAlign: 'center',
  },
  revenueBreakdown: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  revenueBreakdownItem: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  revenueBreakdownDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  revenueBreakdownLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  revenueBreakdownValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  tapHintSmall: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
  },

  // BILLS ROW
  billsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  billCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    position: 'relative',
  },
  monthlyBillCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F97316',
  },
  overdueBillCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  billIconContainer: {
    backgroundColor: '#FEF3E2',
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  billLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  billSubLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 8,
  },
  billAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  billFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  billCustomerCount: {
    fontSize: 11,
    color: '#6B7280',
  },
  urgentBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgentBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#fff',
  },

  // STATS ROW
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 2,
  },
  statSubLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },

  // INSIGHT CARD
  insightCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
  },
  insightText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
    marginBottom: 12,
  },
  insightButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  insightButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
  },

  // SUMMARY CARD
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryLabelBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  summaryValueDanger: {
    color: '#EF4444',
  },
  summaryValueBold: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },

  bottomPadding: {
    height: 20,
  },
});