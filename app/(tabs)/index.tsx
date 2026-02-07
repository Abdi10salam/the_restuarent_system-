// app/(tabs)/index.tsx - REDESIGNED CUSTOMER MENU
"use client"

import { useState, useMemo, useEffect } from "react"
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, TextInput } from "react-native"
import { Plus, ShoppingCart, Search, Flame, Star } from "lucide-react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useApp } from "../../context/AppContext"
import { useAuth } from "../../context/AuthContext"
import { useRouter } from "expo-router"
import { formatCurrency } from "../../utils/currency"
import { calculateDishPerformance, getTrendingUpDishes } from "../../utils/dish-analytics"
import type { Dish } from "../../types" // Import the Dish type

export default function CustomerMenuScreen() {
  const router = useRouter()
  const { state: appState, dispatch } = useApp()
  const { state: authState } = useAuth()
  const { dishes, cart, orders } = appState
  const currentUser = authState.currentUser
  
  const [selectedCategory, setSelectedCategory] = useState("Popular")
  const [searchQuery, setSearchQuery] = useState("")
  const [addedDishId, setAddedDishId] = useState<string | null>(null)

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const performance = useMemo(() => {
    return calculateDishPerformance(orders, dishes, 'month');
  }, [orders, dishes]);

  const ratingByDishId = useMemo(() => {
    const map = new Map<string, number>();
    performance.forEach(p => map.set(p.dishId, p.averageRating));
    return map;
  }, [performance]);

  // Get popular dishes (most ordered)
  const popularDishes = useMemo(() => {
    return getTrendingUpDishes(performance, 10)
      .filter(p => p.isAvailable)
      .map(p => dishes.find(d => d.id === p.dishId))
      .filter((dish): dish is Dish => dish !== undefined); // Filter out undefined and assert type
  }, [performance, dishes]);

  // Category icons and filters (meal types)
  const categories = [
    { id: "Popular", label: "Popular", icon: require("../../assets/images/filename..png"), color: "#3B5D4F" },
    { id: "Breakfast", label: "Breakfast", icon: require("../../assets/images/coffee-cup.png"), color: "#E5E7EB" },
    { id: "Lunch", label: "Lunch", icon: require("../../assets/images/lunch.png"), color: "#E5E7EB" },
    { id: "Dinner", label: "Dinner", icon: require("../../assets/images/dinner.png"), color: "#E5E7EB" },
    { id: "Supper", label: "Supper", icon: require("../../assets/images/supper.png"), color: "#E5E7EB" },
    { id: "Juices", label: "Juices", icon: require("../../assets/images/juices.png"), color: "#E5E7EB" },
  ];

  // Filter dishes based on category and search
  const filteredDishes = useMemo(() => {
    let result = dishes.filter(dish => dish.available);

    // Apply category filter
    if (selectedCategory === "Popular") {
      result = popularDishes.length > 0 ? popularDishes : result.slice(0, 8);
    } else if (selectedCategory === "Breakfast" || 
               selectedCategory === "Lunch" || 
               selectedCategory === "Dinner" || 
               selectedCategory === "Supper" ||
               selectedCategory === "Juices") {
      // Filter by actual dish category
      result = result.filter(dish => dish.category === selectedCategory);
    }

    // Apply search filter
    if (searchQuery) {
      result = result.filter(dish => 
        dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dish.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dish.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return result;
  }, [selectedCategory, searchQuery, dishes, popularDishes]);

  const handleAddToCart = (dish: any) => {
    dispatch({ type: "ADD_TO_CART", dish });
    setAddedDishId(dish.id);
    setTimeout(() => setAddedDishId(null), 1000);
  };

  const handleViewCart = () => {
    router.push("/(tabs)/cart");
  };

  // Get first name
  const firstName = currentUser?.name?.split(' ')[0] || 'Friend';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with Profile */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.profilePicContainer}
              onPress={() => router.push("/(tabs)/profile")}
              activeOpacity={0.8}
            >
              {currentUser?.profilePhoto ? (
                <Image 
                  source={{ uri: currentUser.profilePhoto }} 
                  style={styles.profilePic}
                />
              ) : (
                <View style={styles.profilePicPlaceholder}>
                  <Text style={styles.profileInitial}>
                    {firstName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            
            <View>
              <Text style={styles.greeting}>Hi {firstName}!</Text>
              <Text style={styles.tagline}>
                We're always in the mood{'\n'}for <Text style={styles.taglineHighlight}>good food</Text>
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.cartButton} 
            onPress={handleViewCart}
            activeOpacity={0.8}
          >
            <ShoppingCart size={24} color="#6B7280" strokeWidth={2} />
            {cartItemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#9CA3AF" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search dishes and categories"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categories.map((category) => {
            const isSelected = selectedCategory === category.id;
            
            return (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryItem}
                onPress={() => setSelectedCategory(category.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.categoryCircle,
                    { backgroundColor: isSelected ? category.color : '#F3F4F6' }
                  ]}
                >
                  {typeof category.icon === "number" ? (
                    <Image
                      source={category.icon}
                      style={styles.categoryImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <category.icon 
                      size={28} 
                      color={isSelected ? "#fff" : "#6B7280"} 
                      strokeWidth={2}
                    />
                  )}
                </View>
                <Text 
                  style={[
                    styles.categoryLabel,
                    isSelected && styles.categoryLabelActive
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>
          {selectedCategory === "Popular" ? "Popular Dishes" : 
           selectedCategory === "Breakfast" ? "Breakfast Menu" :
           selectedCategory === "Lunch" ? "Lunch Menu" :
           selectedCategory === "Dinner" ? "Dinner Menu" :
           selectedCategory === "Supper" ? "Supper Menu" :
           selectedCategory === "Juices" ? "Juices Menu" : "Our Menu"}
        </Text>

        {/* Dishes Grid */}
        <View style={styles.dishesGrid}>
          {filteredDishes.map((dish) => {
            const isAdded = addedDishId === dish.id;
            const rating = ratingByDishId.get(dish.id) ?? 0;
            
            return (
              <TouchableOpacity
                key={dish.id}
                style={styles.dishCard}
                onPress={() => handleAddToCart(dish)}
                activeOpacity={0.9}
              >
                {/* Dish Image */}
                <View style={styles.dishImageContainer}>
                  <Image 
                    source={{ uri: dish.image }} 
                    style={styles.dishImage}
                    resizeMode="cover"
                  />
                  <View style={styles.ratingBadge}>
                    <Star size={14} color="#D97706" fill="#D97706" strokeWidth={1} />
                    <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                  </View>
                  
                  {/* Add Button Overlay */}
                  <LinearGradient
                    colors={isAdded ? ["#D97706", "#B45309"] : ["#8acc81", "#2F4A3F"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.addButtonOverlay}
                  >
                    <Plus size={20} color="#fff" strokeWidth={3} />
                  </LinearGradient>
                </View>

                {/* Dish Info */}
                <View style={styles.dishInfo}>
                  <Text style={styles.dishName} numberOfLines={1}>
                    {dish.name}
                  </Text>
                  <Text style={styles.dishCategory}>{dish.category}</Text>
                  <Text style={styles.dishPrice}>{formatCurrency(dish.price)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Empty State */}
        {filteredDishes.length === 0 && (
          <View style={styles.emptyState}>
            <Image
              source={require("../../assets/images/no_dish.png")}
              style={styles.emptyIcon}
              resizeMode="contain"
            />
            <Text style={styles.emptyText}>No dishes found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? "Try a different search" : "Check back later for new items"}
            </Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F3EE",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
  },
  
  // HEADER
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  profilePicContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#3B5D4F",
  },
  profilePic: {
    width: "100%",
    height: "100%",
  },
  profilePicPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#3B5D4F",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitial: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  greeting: {
    fontSize: 16,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  tagline: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    lineHeight: 28,
  },
  taglineHighlight: {
    color: "#D97706",
  },
  cartButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#F7F3EE",
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },

  // SEARCH
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 24,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
  },

  // CATEGORIES
  categoriesScroll: {
    paddingHorizontal: 20,
    gap: 20,
    marginBottom: 24,
  },
  categoryItem: {
    width: 72,
    alignItems: "center",
  },
  categoryCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 8,
  },
  categoryImage: {
    width: 36,
    height: 36,
  },
  categoryLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    textAlign: "center",
  },
  categoryLabelActive: {
    color: "#1F2937",
    fontWeight: "700",
  },

  // SECTION TITLE
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
    paddingHorizontal: 20,
  },

  // DISHES GRID
  dishesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    gap: 12,
  },
  dishCard: {
    width: "48%",
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  dishImageContainer: {
    width: "100%",
    aspectRatio: 1.2,
    backgroundColor: "#E5E7EB",
    position: "relative",
  },
  dishImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E5E7EB",
  },
  addButtonOverlay: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3B5D4F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  ratingBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1F2937",
  },
  dishInfo: {
    padding: 12,
  },
  dishName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  dishCategory: {
    fontSize: 12,
    fontStyle: "italic",
    color: "#6B7280",
    marginBottom: 10,
  },
  dishPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: "#D97706",
  },

  // EMPTY STATE
  emptyState: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyIcon: {
    width: 64,
    height: 64,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#9CA3AF",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#D1D5DB",
  },

  bottomPadding: {
    height: 32,
  },
});
