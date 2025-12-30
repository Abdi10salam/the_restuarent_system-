import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategoryFilter({ categories, selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const allCategories = ['All', ...categories];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {allCategories.map((category) => {
          const isSelected = selectedCategory === category;
          
          return (
            <TouchableOpacity
              key={category}
              onPress={() => onSelectCategory(category)}
              activeOpacity={0.7}
              style={styles.categoryButton}
            >
              {isSelected ? (
                <LinearGradient
                  colors={['#F97316', '#EA580C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.selectedGradient}
                >
                  <Text style={styles.selectedText}>{category}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.unselectedButton}>
                  <Text style={styles.unselectedText}>{category}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF3E2',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(249, 115, 22, 0.1)',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  selectedGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  selectedText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  unselectedButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(249, 115, 22, 0.2)',
  },
  unselectedText: {
    color: '#F97316',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});