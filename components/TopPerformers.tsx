// components/TopPerformers.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { DollarSign, Star, TrendingUp, Award, ChevronRight } from 'lucide-react-native';
import { formatCurrency } from '../utils/currency';
import {
  calculateDishPerformance,
  getTopRevenueGenerators,
  formatTrend,
  getTrendColor,
  getStarRating,
  DishPerformance,
} from '../utils/dish-analytics';
import { Order, Dish } from '../types';

interface TopPerformersProps {
  orders: Order[];
  dishes: Dish[];
  timeframe?: 'week' | 'month' | 'all';
}

export function TopPerformers({ 
  orders, 
  dishes, 
  timeframe = 'month' 
}: TopPerformersProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>(timeframe);

  // Calculate performance metrics
  const performance = useMemo(() => 
    calculateDishPerformance(orders, dishes, selectedTimeframe),
    [orders, dishes, selectedTimeframe]
  );

  const topRevenue = useMemo(() => 
    getTopRevenueGenerators(performance, 5),
    [performance]
  );

  // Calculate total revenue for percentage
  const totalRevenue = useMemo(() => 
    topRevenue.reduce((sum, dish) => sum + dish.totalRevenue, 0),
    [topRevenue]
  );

  // Render star rating
  const renderStars = (rating: number) => {
    const { filled, empty } = getStarRating(rating);
    return (
      <View style={styles.starsContainer}>
        {[...Array(filled)].map((_, i) => (
          <Star key={`filled-${i}`} size={11} color="#F59E0B" fill="#F59E0B" strokeWidth={1} />
        ))}
        {[...Array(empty)].map((_, i) => (
          <Star key={`empty-${i}`} size={11} color="#D1D5DB" fill="none" strokeWidth={1} />
        ))}
      </View>
    );
  };

  // Render dish card
  const renderDishCard = (dish: DishPerformance, index: number) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
    const percentage = totalRevenue > 0 ? (dish.totalRevenue / totalRevenue) * 100 : 0;
    const trendColor = getTrendColor(dish.trendPercentage);

    return (
      <TouchableOpacity
        key={dish.dishId}
        style={[styles.dishCard, index < 3 && styles.topThreeCard]}
        onPress={() => console.log('View dish:', dish.dishName)}
        activeOpacity={0.7}
      >
        {/* Medal Badge */}
        {medal && (
          <View style={styles.medalBadge}>
            <Text style={styles.medalText}>{medal}</Text>
          </View>
        )}

        {/* Dish Image */}
        <Image source={{ uri: dish.dishImage }} style={styles.dishImage} />

        {/* Dish Info */}
        <View style={styles.dishInfo}>
          <Text style={styles.dishName} numberOfLines={1}>
            {dish.dishName}
          </Text>
          
          {/* Rating */}
          <View style={styles.ratingRow}>
            {renderStars(dish.averageRating)}
            <Text style={styles.ratingText}>{dish.averageRating}</Text>
          </View>

          {/* Revenue */}
          <Text style={styles.revenueAmount}>{formatCurrency(dish.totalRevenue)}</Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${percentage}%` }]} />
          </View>
          <Text style={styles.percentageText}>{percentage.toFixed(0)}% of total</Text>

          {/* Bottom Stats */}
          <View style={styles.bottomStats}>
            <Text style={styles.orderCount}>{dish.orderCount} orders</Text>
            {dish.trendPercentage !== 0 && (
              <View style={[styles.miniTrendBadge, { backgroundColor: trendColor }]}>
                <Text style={styles.miniTrendText}>{formatTrend(dish.trendPercentage)}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>💰 TOP PERFORMERS</Text>
          <Text style={styles.subtitle}>Dishes generating most revenue</Text>
        </View>

        {/* Timeframe Selector */}
        <View style={styles.timeframeSelector}>
          {(['week', 'month', 'all'] as const).map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[
                styles.timeframeButton,
                selectedTimeframe === tf && styles.timeframeButtonActive
              ]}
              onPress={() => setSelectedTimeframe(tf)}
            >
              <Text style={[
                styles.timeframeButtonText,
                selectedTimeframe === tf && styles.timeframeButtonTextActive
              ]}>
                {tf === 'week' ? 'Week' : tf === 'month' ? 'Month' : 'All'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Total Revenue Summary */}
      {totalRevenue > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <DollarSign size={18} color="#41956a" strokeWidth={2.5} />
          </View>
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>Total Revenue (Top {topRevenue.length})</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(totalRevenue)}</Text>
          </View>
        </View>
      )}

      {/* Dishes Grid */}
      {topRevenue.length > 0 ? (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dishesScroll}
        >
          {topRevenue.map((dish, index) => renderDishCard(dish, index))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No revenue data yet</Text>
          <Text style={styles.emptySubtext}>Data will appear as orders are completed</Text>
        </View>
      )}

      {/* View All Button */}
      {topRevenue.length > 0 && (
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => console.log('View all performers')}
        >
          <Text style={styles.viewAllText}>View All Dishes</Text>
          <ChevronRight size={18} color="#41956a" strokeWidth={2} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderLeftWidth: 6,
    borderLeftColor: '#41956a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  timeframeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  timeframeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  timeframeButtonActive: {
    backgroundColor: '#41956a',
  },
  timeframeButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  timeframeButtonTextActive: {
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryInfo: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#41956a',
  },
  dishesScroll: {
    paddingRight: 16,
    gap: 12,
  },
  dishCard: {
    width: 150,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  topThreeCard: {
    borderColor: '#9ecda5',
  },
  medalBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  medalText: {
    fontSize: 16,
  },
  dishImage: {
    width: '100%',
    height: 90,
    backgroundColor: '#E5E7EB',
  },
  dishInfo: {
    padding: 12,
  },
  dishName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  revenueAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#41956a',
    marginBottom: 8,
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#41956a',
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 8,
  },
  bottomStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderCount: {
    fontSize: 10,
    color: '#6B7280',
  },
  miniTrendBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniTrendText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#fff',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    marginTop: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#41956a',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#D1D5DB',
  },
});