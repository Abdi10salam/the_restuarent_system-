import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  iconMap?: Record<string, any>;
}

export function CategoryFilter({ categories, selectedCategory, onSelectCategory, iconMap }: CategoryFilterProps) {
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
                  colors={['#3B5D4F', '#2F4A3F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.selectedGradient}
                >
                  {iconMap?.[category] && (
                    <Image source={iconMap[category]} style={styles.categoryIcon} resizeMode="contain" />
                  )}
                  <Text style={styles.selectedText}>{category}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.unselectedButton}>
                  {iconMap?.[category] && (
                    <Image source={iconMap[category]} style={styles.categoryIcon} resizeMode="contain" />
                  )}
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
    backgroundColor: '#F7F3EE',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 93, 79, 0.12)',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryButton: {
   
    
  },
  selectedGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: '#3B5D4F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    borderRadius: 24,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(59, 93, 79, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unselectedText: {
    color: '#3B5D4F',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  categoryIcon: {
    width: 18,
    height: 18,
  },
});
