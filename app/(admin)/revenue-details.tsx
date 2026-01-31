// app/(admin)/revenue-details.tsx - COMPLETELY FIXED
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { TrendingUp, Calendar, Clock, User, ShoppingBag, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/currency';
import { getMonthRange, calculateRevenue } from '../../utils/payment-calculations';

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

  // ✅ FIXED: Use the shared calculateRevenue function with filtered orders
  const revenueData = useMemo(() => {
    console.log('📊 Revenue Details - Calculating for range:',
      selectedDateRange.startDate.toLocaleDateString(),
      'to',
      selectedDateRange.endDate.toLocaleDateString()
    );

    // Filter orders by selected date range FIRST
    const ordersInRange = orders.filter(order => {
      const orderDate = order.approvedAt ? new Date(order.approvedAt) : new Date(order.createdAt);
      return orderDate >= selectedDateRange.startDate &&
        orderDate <= selectedDateRange.endDate;
    });

    console.log('  Orders in range:', ordersInRange.length);
    console.log('  Total orders:', orders.length);

    // Then use the calculation function with filtered orders
    const result = calculateRevenue(ordersInRange, customers);

    console.log('  Revenue result:', {
      total: result.totalRevenue,
      walkIn: result.walkInRevenue,
      monthly: result.monthlyPaymentsRevenue,
    });

    return result;
  }, [orders, customers, selectedDateRange]);

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

  // Group orders by day for display
  const ordersByDay = useMemo(() => {
    const grouped = new Map<string, typeof revenueData.revenueOrders>();

    revenueData.revenueOrders.forEach(order => {
      const orderDate = order.approvedAt ? new Date(order.approvedAt) : new Date(order.createdAt);
      const dayKey = orderDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      if (!grouped.has(dayKey)) {
        grouped.set(dayKey, []);
      }
      grouped.get(dayKey)!.push(order);
    });

    // Sort by date (most recent first)
    return Array.from(grouped.entries()).sort((a, b) => {
      const dateA = new Date(a[0]);
      const dateB = new Date(b[0]);
      return dateB.getTime() - dateA.getTime();
    });
  }, [revenueData.revenueOrders]);

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
            <TrendingUp size={28} color="#10B981" strokeWidth={2.5} />
            <Text style={styles.summaryTitle}>Revenue Summary</Text>
          </View>

          <View style={styles.totalRevenueSection}>
            <Text style={styles.totalRevenueLabel}>Total Revenue</Text>
            <Text style={styles.totalRevenueAmount}>
              {formatCurrency(revenueData.totalRevenue)}
            </Text>
          </View>

          <View style={styles.breakdownSection}>
            <View style={styles.breakdownItem}>
              <View style={styles.breakdownIconContainer}>
                <ShoppingBag size={20} color="#059669" strokeWidth={2} />
              </View>
              <View style={styles.breakdownDetails}>
                <Text style={styles.breakdownLabel}>Walk-in Cash</Text>
                <Text style={styles.breakdownAmount}>
                  {formatCurrency(revenueData.walkInRevenue)}
                </Text>
              </View>
            </View>

            <View style={styles.breakdownDivider} />

            <View style={styles.breakdownItem}>
              <View style={styles.breakdownIconContainer}>
                <User size={20} color="#0284C7" strokeWidth={2} />
              </View>
              <View style={styles.breakdownDetails}>
                <Text style={styles.breakdownLabel}>Monthly Payments</Text>
                <Text style={styles.breakdownAmount}>
                  {formatCurrency(revenueData.monthlyPaymentsRevenue)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Daily Revenue Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Breakdown</Text>

          {ordersByDay.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={64} color="#CBD5E1" strokeWidth={1} />
              <Text style={styles.emptyText}>No Revenue</Text>
              <Text style={styles.emptySubtext}>
                No orders found for this period
              </Text>
            </View>
          ) : (
            ordersByDay.map(([date, dayOrders]) => {
              const dayTotal = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0);

              return (
                <View key={date} style={styles.dayCard}>
                  <View style={styles.dayHeader}>
                    <View style={styles.dayHeaderLeft}>
                      <Clock size={18} color="#6B7280" strokeWidth={2} />
                      <Text style={styles.dayDate}>{date}</Text>
                    </View>
                    <Text style={styles.dayTotal}>{formatCurrency(dayTotal)}</Text>
                  </View>

                  <View style={styles.dayOrders}>
                    {dayOrders.map((order) => (
                      <View key={order.id} style={styles.orderItem}>
                        <View style={styles.orderInfo}>
                          <View style={styles.orderCustomer}>
                            <User size={14} color="#6B7280" strokeWidth={2} />
                            <Text style={styles.orderCustomerName}>{order.customerName}</Text>
                            {order.isWalkIn && (
                              <View style={styles.walkInBadge}>
                                <Text style={styles.walkInBadgeText}>Walk-in</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.orderId}>#{order.id.slice(-6)}</Text>
                        </View>
                        <Text style={styles.orderAmount}>{formatCurrency(order.totalAmount)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalRevenueSection: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  totalRevenueLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  totalRevenueAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#10B981',
  },
  breakdownSection: {
    flexDirection: 'row',
    marginTop: 16,
  },
  breakdownItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  breakdownIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakdownDetails: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  breakdownAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
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
    borderRadius: 12,
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
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  dayTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  dayOrders: {
    gap: 8,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  orderInfo: {
    flex: 1,
    gap: 4,
  },
  orderCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderCustomerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  walkInBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  walkInBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  orderId: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
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