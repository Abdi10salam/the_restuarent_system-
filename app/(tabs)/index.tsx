import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { DishCard } from '../../components/DishCard';
import { CategoryFilter } from '../../components/CategoryFilter';
import { useApp } from '../../context/AppContext';

export default function MenuScreen() {
  const { state, dispatch } = useApp();
  const { dishes } = state;
  const [selectedCategory, setSelectedCategory] = useState('All');

  const handleAddToCart = (dish: any) => {
    dispatch({ type: 'ADD_TO_CART', dish });
  };

  // Get unique categories from dishes
  const categories = useMemo(() => {
    const availableDishes = dishes.filter(dish => dish.available);
    const uniqueCategories = [...new Set(availableDishes.map(dish => dish.category))];
    return uniqueCategories.sort();
  }, [dishes]);

  // Filter dishes based on selected category
  const filteredDishes = useMemo(() => {
    const availableDishes = dishes.filter(dish => dish.available);
    if (selectedCategory === 'All') {
      return availableDishes;
    }
    return availableDishes.filter(dish => dish.category === selectedCategory);
  }, [selectedCategory, dishes]);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Our Menu</Text>
        <Text style={styles.subtitle}>Delicious dishes made with love</Text>
      </View>
      
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredDishes.map((dish) => (
          <DishCard
            key={dish.id}
            dish={dish}
            onAddToCart={handleAddToCart}
          />
        ))}
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
  header: {
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  bottomPadding: {
    height: 20,
  },
});