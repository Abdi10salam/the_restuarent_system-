// components/TrendingDishes.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { TrendingUp, TrendingDown, Star, Flame, ChevronRight } from 'lucide-react-native';
import { formatCurrency } from '../utils/currency';
import {
  calculateDishPerformance,
  getTrendingUpDishes,
  getTrendingDownDishes,
  formatTrend,
  getTrendColor,
  getStarRating,
  DishPerformance,
} from '../utils/dish-analytics';
import { Order, Dish } from '../types';

interface TrendingDishesProps {
  orders: Order[];
  dishes: Dish[];
  timeframe?: 'week' | 'month' | 'all';
}

export function TrendingDishes({ 
  orders, 
  dishes, 
  timeframe = 'month' 
}: TrendingDishesProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>(timeframe);

  // Calculate performance metrics
  const performance = useMemo(() => 
    calculateDishPerformance(orders, dishes, selectedTimeframe),
    [orders, dishes, selectedTimeframe]
  );

  const trendingUp = useMemo(() => 
    getTrendingUpDishes(performance, 5),
    [performance]
  );

  const trendingDown = useMemo(() => 
    getTrendingDownDishes(performance, 3),
    [performance]
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

  // Render trending up card
  const renderHotDishCard = (dish: DishPerformance, index: number) => {
    const trendColor = getTrendColor(dish.trendPercentage);
    const showFlame = index === 0; // First dish gets flame icon

    return (
      <TouchableOpacity
        key={dish.dishId}
        style={[styles.dishCard, index === 0 && styles.topDishCard]}
        onPress={() => console.log('View dish:', dish.dishName)}
        activeOpacity={0.7}
      >
        {/* Hot Badge for #1 */}
        {showFlame && (
          <View style={styles.flameBadge}>
            <Flame size={14} color="#fff" fill="#F97316" strokeWidth={1.5} />
          </View>
        )}

        {/* Dish Image */}
        <Image source={{ uri: dish.dishImage }} style={styles.dishImage} />

        {/* Gradient Overlay */}
        <View style={styles.imageOverlay} />

        {/* Dish Info */}
        <View style={styles.dishInfo}>
          <Text style={styles.dishName} numberOfLines={1}>
            {dish.dishName}
          </Text>
          
          {/* Rating & Category */}
          <View style={styles.metaRow}>
            {renderStars(dish.averageRating)}
            <Text style={styles.categoryBadge}>{dish.dishCategory}</Text>
          </View>

          {/* Trend Badge */}
          <View style={[styles.trendBadge, { backgroundColor: trendColor }]}>
            <TrendingUp size={13} color="#fff" strokeWidth={2.5} />
            <Text style={styles.trendText}>{formatTrend(dish.trendPercentage)}</Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <Text style={styles.orderCount}>{dish.orderCount} orders</Text>
            <Text style={styles.revenue}>{formatCurrency(dish.totalRevenue)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render declining card
  const renderColdDishCard = (dish: DishPerformance) => {
    return (
      <TouchableOpacity
        key={dish.dishId}
        style={[styles.dishCard, styles.coldDishCard]}
        onPress={() => console.log('View dish:', dish.dishName)}
        activeOpacity={0.7}
      >
        <Image source={{ uri: dish.dishImage }} style={styles.dishImageSmall} />
        
        <View style={styles.coldDishInfo}>
          <Text style={styles.dishName} numberOfLines={1}>
            {dish.dishName}
          </Text>
          
          <View style={[styles.trendBadge, styles.trendBadgeNegative]}>
            <TrendingDown size={12} color="#fff" strokeWidth={2.5} />
            <Text style={styles.trendText}>{formatTrend(dish.trendPercentage)}</Text>
          </View>
          
          <Text style={styles.orderCountSmall}>{dish.orderCount} orders only</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🔥 TRENDING DISHES</Text>
          <Text style={styles.subtitle}>What's hot & what's not</Text>
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

      {/* Hot Dishes Section */}
      {trendingUp.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📈 Hot Dishes</Text>
            <TouchableOpacity onPress={() => console.log('View all hot')}>
              <ChevronRight size={18} color="#9ecda5" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dishesScroll}
          >
            {trendingUp.map((dish, index) => renderHotDishCard(dish, index))}
          </ScrollView>
        </View>
      )}

      {/* Declining Dishes Section */}
      {trendingDown.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📉 Declining Dishes</Text>
            <Text style={styles.sectionHint}>Needs attention</Text>
          </View>

          <View style={styles.coldDishesGrid}>
            {trendingDown.map((dish) => renderColdDishCard(dish))}
          </View>
        </View>
      )}

      {/* Empty State */}
      {trendingUp.length === 0 && trendingDown.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No trending data yet</Text>
          <Text style={styles.emptySubtext}>Data will appear as orders come in</Text>
        </View>
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
    marginBottom: 20,
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sectionHint: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
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
  topDishCard: {
    borderColor: '#41956a',
    backgroundColor: '#f0fdf4',
  },
  flameBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    backgroundColor: '#F97316',
    borderRadius: 12,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  dishImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#E5E7EB',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.1)',
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
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  categoryBadge: {
    fontSize: 9,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  trendBadgeNegative: {
    backgroundColor: '#EF4444',
  },
  trendText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderCount: {
    fontSize: 10,
    color: '#6B7280',
  },
  revenue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#41956a',
  },
  
  // Cold Dishes
  coldDishesGrid: {
    gap: 8,
  },
  coldDishCard: {
    width: '100%',
    flexDirection: 'row',
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    padding: 12,
  },
  dishImageSmall: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  coldDishInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  orderCountSmall: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
  },
  
  // Empty State
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