// components/DishInsights.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lightbulb, TrendingUp, AlertTriangle, Package, ChevronRight } from 'lucide-react-native';
import {
  calculateDishPerformance,
  getPerformanceInsights,
} from '../utils/dish-analytics';
import { Order, Dish } from '../types';

interface DishInsightsProps {
  orders: Order[];
  dishes: Dish[];
  timeframe?: 'week' | 'month' | 'all';
}

export function DishInsights({ 
  orders, 
  dishes, 
  timeframe = 'month' 
}: DishInsightsProps) {
  // Calculate performance metrics
  const performance = useMemo(() => 
    calculateDishPerformance(orders, dishes, timeframe),
    [orders, dishes, timeframe]
  );

  const insights = useMemo(() => 
    getPerformanceInsights(performance),
    [performance]
  );

  // Don't render if no insights
  if (insights.length === 0) {
    return null;
  }

  // Categorize insights by type
  const getInsightIcon = (insight: string) => {
    if (insight.includes('trending up') || insight.includes('stock')) {
      return <TrendingUp size={16} color="#41956a" strokeWidth={2} />;
    }
    if (insight.includes('declining') || insight.includes('investigate')) {
      return <AlertTriangle size={16} color="#F59E0B" strokeWidth={2} />;
    }
    if (insight.includes('removal') || insight.includes('only')) {
      return <Package size={16} color="#EF4444" strokeWidth={2} />;
    }
    return <Lightbulb size={16} color="#41956a" strokeWidth={2} />;
  };

  const getInsightColor = (insight: string) => {
    if (insight.includes('trending up') || insight.includes('stock')) {
      return '#f0fdf4'; // Green background
    }
    if (insight.includes('declining') || insight.includes('investigate')) {
      return '#FFFBEB'; // Yellow background
    }
    if (insight.includes('removal') || insight.includes('only')) {
      return '#FEF2F2'; // Red background
    }
    return '#f0fdf4';
  };

  const getInsightBorderColor = (insight: string) => {
    if (insight.includes('trending up') || insight.includes('stock')) {
      return '#41956a';
    }
    if (insight.includes('declining') || insight.includes('investigate')) {
      return '#F59E0B';
    }
    if (insight.includes('removal') || insight.includes('only')) {
      return '#EF4444';
    }
    return '#41956a';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <Lightbulb size={18} color="#41956a" strokeWidth={2.5} />
          </View>
          <View>
            <Text style={styles.title}>💡 INSIGHTS</Text>
            <Text style={styles.subtitle}>AI-powered recommendations</Text>
          </View>
        </View>
      </View>

      {/* Insights List */}
      <View style={styles.insightsList}>
        {insights.map((insight, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.insightCard,
              { 
                backgroundColor: getInsightColor(insight),
                borderLeftColor: getInsightBorderColor(insight)
              }
            ]}
            onPress={() => console.log('View insight details:', insight)}
            activeOpacity={0.7}
          >
            <View style={styles.insightIcon}>
              {getInsightIcon(insight)}
            </View>
            
            <Text style={styles.insightText}>{insight}</Text>
            
            <ChevronRight size={16} color="#9CA3AF" strokeWidth={2} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Based on {timeframe === 'week' ? 'this week' : timeframe === 'month' ? 'this month' : 'all time'}'s performance data
        </Text>
      </View>
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
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  insightsList: {
    gap: 10,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    gap: 10,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#1F2937',
  },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});