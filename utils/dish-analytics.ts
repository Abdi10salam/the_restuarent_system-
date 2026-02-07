// utils/dish-analytics.ts
import { Order, Dish } from '../types';

export interface DishPerformance {
  dishId: string;
  dishName: string;
  dishImage: string;
  dishCategory: string;
  dishPrice: number;
  orderCount: number;
  totalRevenue: number;
  averageRating: number;
  trendPercentage: number;
  isAvailable: boolean;
}

/**
 * Calculate performance metrics for all dishes
 */
export function calculateDishPerformance(
  orders: Order[],
  dishes: Dish[],
  timeframe: 'week' | 'month' | 'all' = 'month'
): DishPerformance[] {
  const now = new Date();
  const startDate = getStartDate(now, timeframe);
  
  // Filter orders by timeframe and status
  const relevantOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return order.status === 'approved' && orderDate >= startDate;
  });

  // Calculate metrics for each dish
  const dishMetrics = new Map<string, {
    orderCount: number;
    totalRevenue: number;
    orders: Order[];
  }>();

  relevantOrders.forEach(order => {
    order.items.forEach(item => {
      const dishId = item.dish.id;
      const existing = dishMetrics.get(dishId) || {
        orderCount: 0,
        totalRevenue: 0,
        orders: []
      };

      dishMetrics.set(dishId, {
        orderCount: existing.orderCount + item.quantity,
        totalRevenue: existing.totalRevenue + (item.dish.price * item.quantity),
        orders: [...existing.orders, order]
      });
    });
  });

  // Calculate trend (compare with previous period)
  const previousPeriodStart = getStartDate(startDate, timeframe);
  const previousOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return order.status === 'approved' && 
           orderDate >= previousPeriodStart && 
           orderDate < startDate;
  });

  const previousMetrics = new Map<string, number>();
  previousOrders.forEach(order => {
    order.items.forEach(item => {
      const dishId = item.dish.id;
      const existing = previousMetrics.get(dishId) || 0;
      previousMetrics.set(dishId, existing + item.quantity);
    });
  });

  // Build performance array
  const performance: DishPerformance[] = dishes.map(dish => {
    const metrics = dishMetrics.get(dish.id);
    const currentCount = metrics?.orderCount || 0;
    const previousCount = previousMetrics.get(dish.id) || 0;
    
    // Calculate trend percentage
    let trendPercentage = 0;
    if (previousCount > 0) {
      trendPercentage = ((currentCount - previousCount) / previousCount) * 100;
    } else if (currentCount > 0) {
      trendPercentage = 100; // New dish, 100% increase
    }

    // Calculate auto-rating (1-5 stars)
    // Based on: 40% order count, 40% revenue, 20% trend
    const maxOrders = Math.max(...Array.from(dishMetrics.values()).map(m => m.orderCount));
    const maxRevenue = Math.max(...Array.from(dishMetrics.values()).map(m => m.totalRevenue));
    
    const orderScore = maxOrders > 0 ? (currentCount / maxOrders) * 2 : 0; // 0-2
    const revenueScore = maxRevenue > 0 ? ((metrics?.totalRevenue || 0) / maxRevenue) * 2 : 0; // 0-2
    const trendScore = trendPercentage > 0 ? Math.min(trendPercentage / 100, 1) : 0; // 0-1
    
    const averageRating = Math.min(5, Math.max(1, orderScore + revenueScore + trendScore));

    return {
      dishId: dish.id,
      dishName: dish.name,
      dishImage: dish.image,
      dishCategory: dish.category,
      dishPrice: dish.price,
      orderCount: currentCount,
      totalRevenue: metrics?.totalRevenue || 0,
      averageRating: Number(averageRating.toFixed(1)),
      trendPercentage: Number(trendPercentage.toFixed(1)),
      isAvailable: dish.available,
    };
  });

  return performance;
}

/**
 * Get top dishes by revenue
 */
export function getTopRevenueGenerators(
  performance: DishPerformance[],
  limit: number = 3
): DishPerformance[] {
  return [...performance]
    .filter(p => p.totalRevenue > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, limit);
}

/**
 * Get trending dishes (biggest positive trend)
 */
export function getTrendingUpDishes(
  performance: DishPerformance[],
  limit: number = 3
): DishPerformance[] {
  return [...performance]
    .filter(p => p.trendPercentage > 0 && p.orderCount > 0)
    .sort((a, b) => b.trendPercentage - a.trendPercentage)
    .slice(0, limit);
}

/**
 * Get declining dishes (biggest negative trend)
 */
export function getTrendingDownDishes(
  performance: DishPerformance[],
  limit: number = 3
): DishPerformance[] {
  return [...performance]
    .filter(p => p.trendPercentage < 0)
    .sort((a, b) => a.trendPercentage - b.trendPercentage)
    .slice(0, limit);
}

/**
 * Get underperforming dishes (low orders, low trend)
 */
export function getUnderperformingDishes(
  performance: DishPerformance[],
  limit: number = 3
): DishPerformance[] {
  return [...performance]
    .filter(p => p.isAvailable && (p.orderCount < 5 || p.trendPercentage < -20))
    .sort((a, b) => {
      // Sort by combined low performance
      const aScore = a.orderCount + (a.trendPercentage / 10);
      const bScore = b.orderCount + (b.trendPercentage / 10);
      return aScore - bScore;
    })
    .slice(0, limit);
}

/**
 * Helper: Get start date based on timeframe
 */
function getStartDate(fromDate: Date, timeframe: 'week' | 'month' | 'all'): Date {
  const date = new Date(fromDate);
  
  switch (timeframe) {
    case 'week':
      date.setDate(date.getDate() - 7);
      break;
    case 'month':
      date.setMonth(date.getMonth() - 1);
      break;
    case 'all':
      date.setFullYear(2000); // Far past
      break;
  }
  
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Get star rating components (filled/empty)
 */
export function getStarRating(rating: number): { filled: number; empty: number } {
  const filled = Math.floor(rating);
  const empty = 5 - filled;
  return { filled, empty };
}

/**
 * Format trend percentage with sign
 */
export function formatTrend(percentage: number): string {
  if (percentage > 0) return `+${percentage.toFixed(0)}%`;
  if (percentage < 0) return `${percentage.toFixed(0)}%`;
  return '0%';
}

/**
 * Get trend color
 */
export function getTrendColor(percentage: number): string {
  if (percentage > 10) return '#10B981'; // Strong up - green
  if (percentage > 0) return '#9ecda5'; // Slight up - light green
  if (percentage === 0) return '#6B7280'; // No change - gray
  if (percentage > -10) return '#F59E0B'; // Slight down - orange
  return '#EF4444'; // Strong down - red
}

/**
 * Get performance insights
 */
export function getPerformanceInsights(performance: DishPerformance[]): string[] {
  const insights: string[] = [];
  
  const topRevenue = getTopRevenueGenerators(performance, 1)[0];
  if (topRevenue) {
    const percentage = (topRevenue.totalRevenue / performance.reduce((sum, p) => sum + p.totalRevenue, 0)) * 100;
    insights.push(`${topRevenue.dishName} generates ${percentage.toFixed(0)}% of total revenue`);
  }
  
  const trending = getTrendingUpDishes(performance, 1)[0];
  if (trending && trending.trendPercentage > 20) {
    insights.push(`${trending.dishName} is trending up ${trending.trendPercentage.toFixed(0)}% - consider stocking more`);
  }
  
  const declining = getTrendingDownDishes(performance, 1)[0];
  if (declining && declining.trendPercentage < -20) {
    insights.push(`${declining.dishName} is declining ${Math.abs(declining.trendPercentage).toFixed(0)}% - investigate quality or pricing`);
  }
  
  const underperforming = getUnderperformingDishes(performance, 1)[0];
  if (underperforming && underperforming.orderCount < 5) {
    insights.push(`${underperforming.dishName} has only ${underperforming.orderCount} orders - consider removal or promotion`);
  }
  
  return insights;
}