// app/(admin)/revenue-details.tsx - WITH DATE RANGE PICKER
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { DollarSign, TrendingUp, Calendar, Clock, User, ShoppingBag, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/currency';
import { getMonthRange } from '../../utils/payment-calculations';

export default function RevenueDetailsScreen() {
  const { state, fetchOrdersFromSupabase, fetchCustomersFromSupabase } = useApp();
  const { orders, customers } = state;
  const [refreshing, setRefreshing] = useState(false);

  // Date picker state
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isSelectingRange, setIsSelectingRange] = useState(false);

  // Get selected date range or default to current month
  const selectedDateRange = useMemo(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    } else if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(startDate);
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    } else {
      const now = new Date();
      return getMonthRange(now.getFullYear(), now.getMonth());
    }
  }, [startDate, endDate]);

  // Calculate revenue for selected date range
  const revenueData = useMemo(() => {
    const revenueOrders = orders.filter(order => {
      const approvedDate = order.approvedAt ? new Date(order.approvedAt) : null;
      return (
        order.status === 'approved' &&
        order.paymentType === 'cash' &&
        approvedDate &&
        approvedDate >= selectedDateRange.startDate &&
        approvedDate <= selectedDateRange.endDate
      );
    });

    const walkInRevenue = revenueOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const monthlyPaymentsRevenue = 0; // TODO: Calculate from payments table

    return {
      totalRevenue: walkInRevenue + monthlyPaymentsRevenue,
      walkInRevenue,
      monthlyPaymentsRevenue,
      revenueOrders,
    };
  }, [orders, selectedDateRange]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchOrdersFromSupabase(),
      fetchCustomersFromSupabase(),
    ]);
    setRefreshing(false);
  };

  // Get display text for selected dates
  const getDateDisplayText = () => {
    if (startDate && endDate && startDate.getTime() !== endDate.getTime()) {
      return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (startDate) {
      return startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } else {
      return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    const selected = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth(), day);

    if (!isSelectingRange) {
      setStartDate(selected);
      setEndDate(null);
      setIsSelectingRange(true);
    } else {
      if (selected < startDate!) {
        setEndDate(startDate);
        setStartDate(selected);
      } else {
        setEndDate(selected);
      }
      setIsSelectingRange(false);
      setShowCalendarModal(false);
    }
  };

  const isDateInRange = (day: number) => {
    if (!startDate) return false;
    const date = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth(), day);
    if (endDate) {
      return date >= startDate && date <= endDate;
    } else {
      return date.getTime() === startDate.getTime();
    }
  };

  const isDateStart = (day: number) => {
    if (!startDate) return false;
    const date = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth(), day);
    return date.getTime() === startDate.getTime();
  };

  const isDateEnd = (day: number) => {
    if (!endDate) return false;
    const date = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth(), day);
    return date.getTime() === endDate.getTime();
  };

  const clearSelection = () => {
    setStartDate(null);
    setEndDate(null);
    setIsSelectingRange(false);
  };

  const navigateCalendarMonth = (direction: number) => {
    const newDate = new Date(currentCalendarMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentCalendarMonth(newDate);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentCalendarMonth);
    const firstDay = getFirstDayOfMonth(currentCalendarMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDayEmpty} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isInRange = isDateInRange(day);
      const isStart = isDateStart(day);
      const isEnd = isDateEnd(day);
      const isToday = new Date().getDate() === day &&
        new Date().getMonth() === currentCalendarMonth.getMonth() &&
        new Date().getFullYear() === currentCalendarMonth.getFullYear();

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isInRange && styles.calendarDayInRange,
            (isStart || isEnd) && styles.calendarDaySelected,
            isToday && !isInRange && styles.calendarDayToday,
          ]}
          onPress={() => handleDateSelect(day)}
        >
          <Text style={[
            styles.calendarDayText,
            (isStart || isEnd) && styles.calendarDayTextSelected,
            isToday && !isInRange && styles.calendarDayTextToday,
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Group orders by date
  const ordersByDate = useMemo(() => {
    const grouped = new Map<string, typeof revenueData.revenueOrders>();

    revenueData.revenueOrders.forEach(order => {
      const dateKey = new Date(order.approvedAt || order.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(order);
    });

    // Convert to array and sort by date (newest first)
    return Array.from(grouped.entries())
      .map(([date, orders]) => ({
        date,
        orders,
        total: orders.reduce((sum, o) => sum + o.totalAmount, 0),
      }))
      .sort((a, b) => new Date(b.orders[0].approvedAt || b.orders[0].createdAt).getTime() -
        new Date(a.orders[0].approvedAt || a.orders[0].createdAt).getTime());
  }, [revenueData]);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />
        }
      >
        {/* Date Range Picker Button */}
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowCalendarModal(true)}
          activeOpacity={0.8}
        >
          <Calendar size={20} color="#10B981" strokeWidth={2} />
          <Text style={styles.datePickerText}>{getDateDisplayText()}</Text>
        </TouchableOpacity>

        {/* Header Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIconContainer}>
              <DollarSign size={32} color="#10B981" strokeWidth={2.5} />
            </View>
            <View style={styles.summaryBadge}>
              <Calendar size={14} color="#10B981" strokeWidth={2} />
              <Text style={styles.summaryBadgeText}>{currentMonth}</Text>
            </View>
          </View>

          <Text style={styles.summaryLabel}>Total Revenue</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(revenueData.totalRevenue)}</Text>

          <View style={styles.summaryBreakdown}>
            <View style={styles.breakdownItem}>
              <View style={styles.breakdownHeader}>
                <ShoppingBag size={16} color="#F97316" strokeWidth={2} />
                <Text style={styles.breakdownLabel}>Walk-in Cash</Text>
              </View>
              <Text style={styles.breakdownValue}>{formatCurrency(revenueData.walkInRevenue)}</Text>
              <Text style={styles.breakdownSubtext}>
                {revenueData.revenueOrders.filter(o => o.paymentType === 'cash').length} transactions
              </Text>
            </View>

            <View style={styles.breakdownDivider} />

            <View style={styles.breakdownItem}>
              <View style={styles.breakdownHeader}>
                <TrendingUp size={16} color="#3B82F6" strokeWidth={2} />
                <Text style={styles.breakdownLabel}>Monthly Payments</Text>
              </View>
              <Text style={styles.breakdownValue}>{formatCurrency(revenueData.monthlyPaymentsRevenue)}</Text>
              <Text style={styles.breakdownSubtext}>
                {revenueData.revenueOrders.filter(o => o.paymentType === 'monthly').length} payments
              </Text>
            </View>
          </View>
        </View>

        {/* Daily Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue by Date</Text>

          {ordersByDate.length === 0 ? (
            <View style={styles.emptyState}>
              <DollarSign size={64} color="#D1D5DB" strokeWidth={1} />
              <Text style={styles.emptyText}>No revenue this month</Text>
              <Text style={styles.emptySubtext}>Revenue will appear here as orders are completed</Text>
            </View>
          ) : (
            ordersByDate.map((dayData, index) => (
              <View key={index} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <View style={styles.dayHeaderLeft}>
                    <Clock size={18} color="#6B7280" strokeWidth={2} />
                    <Text style={styles.dayDate}>{dayData.date}</Text>
                  </View>
                  <Text style={styles.dayTotal}>{formatCurrency(dayData.total)}</Text>
                </View>

                <View style={styles.ordersContainer}>
                  {dayData.orders.map((order) => (
                    <View key={order.id} style={styles.orderRow}>
                      <View style={styles.orderLeft}>
                        <Text style={styles.orderId}>#{order.id.slice(-6)}</Text>
                        <View style={styles.orderCustomerRow}>
                          <User size={12} color="#6B7280" strokeWidth={2} />
                          <Text style={styles.orderCustomerName}>{order.customerName}</Text>
                        </View>
                        {order.isWalkIn && (
                          <View style={styles.walkInBadge}>
                            <Text style={styles.walkInText}>Walk-in</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.orderRight}>
                        <Text style={styles.orderAmount}>{formatCurrency(order.totalAmount)}</Text>
                        <View style={[
                          styles.paymentTypeBadge,
                          order.paymentType === 'cash'
                            ? styles.paymentTypeBadgeCash
                            : styles.paymentTypeBadgeMonthly
                        ]}>
                          <Text style={[
                            styles.paymentTypeText,
                            order.paymentType === 'cash'
                              ? styles.paymentTypeTextCash
                              : styles.paymentTypeTextMonthly
                          ]}>
                            {order.paymentType === 'cash' ? 'Cash' : 'Monthly'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendarModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Select Date Range</Text>
              <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                <X size={24} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarMonthNav}>
              <TouchableOpacity
                style={styles.calendarNavButton}
                onPress={() => navigateCalendarMonth(-1)}
              >
                <ChevronLeft size={20} color="#1F2937" strokeWidth={2} />
              </TouchableOpacity>

              <Text style={styles.calendarMonthText}>
                {currentCalendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>

              <TouchableOpacity
                style={styles.calendarNavButton}
                onPress={() => navigateCalendarMonth(1)}
              >
                <ChevronRight size={20} color="#1F2937" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarWeekDays}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} style={styles.calendarWeekDayText}>{day}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {renderCalendar()}
            </View>

            <View style={styles.calendarActions}>
              {(startDate || endDate) && (
                <TouchableOpacity
                  style={styles.calendarClearButton}
                  onPress={clearSelection}
                >
                  <Text style={styles.calendarClearText}>Clear Selection</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.calendarApplyButton}
                onPress={() => setShowCalendarModal(false)}
              >
                <Text style={styles.calendarApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>

            {isSelectingRange && startDate && (
              <Text style={styles.calendarHint}>
                Select end date (tap same date for single day)
              </Text>
            )}
          </View>
        </View>
      </Modal>
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
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#D1FAE5',
  },
  datePickerText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#10B981',
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderLeftWidth: 6,
    borderLeftColor: '#10B981',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryIconContainer: {
    backgroundColor: '#D1FAE5',
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  summaryBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10B981',
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
    color: '#10B981',
    marginBottom: 20,
  },
  summaryBreakdown: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  breakdownItem: {
    flex: 1,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  breakdownValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  breakdownSubtext: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  breakdownDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
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
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  dayTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  ordersContainer: {
    gap: 12,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  orderLeft: {
    flex: 1,
    gap: 4,
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  orderCustomerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderCustomerName: {
    fontSize: 13,
    color: '#6B7280',
  },
  walkInBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  walkInText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  paymentTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  paymentTypeBadgeCash: {
    backgroundColor: '#D1FAE5',
  },
  paymentTypeBadgeMonthly: {
    backgroundColor: '#DBEAFE',
  },
  paymentTypeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  paymentTypeTextCash: {
    color: '#10B981',
  },
  paymentTypeTextMonthly: {
    color: '#3B82F6',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  calendarModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  calendarMonthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  calendarNavButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  calendarMonthText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  calendarWeekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  calendarWeekDayText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280',
    width: '14.28%',
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  calendarDayEmpty: {
    width: '14.28%',
    aspectRatio: 1,
  },
  calendarDayInRange: {
    backgroundColor: '#D1FAE5',
  },
  calendarDaySelected: {
    backgroundColor: '#10B981',
    borderRadius: 8,
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  calendarDayTextToday: {
    color: '#10B981',
    fontWeight: 'bold',
  },
  calendarActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  calendarClearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  calendarClearText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  calendarApplyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
  },
  calendarApplyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  calendarHint: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});