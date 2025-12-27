// app/(tabs)/index.tsx - FIXED VERSION WITH RECEPTIONIST SUPPORT
"use client"

import { useState, useMemo, useEffect } from "react"
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Alert } from "react-native"
import { Plus, ShoppingCart, CheckCircle, ArrowLeft, User } from "lucide-react-native"
import { CategoryFilter } from "../../components/CategoryFilter"
import { useApp } from "../../context/AppContext"
import { useAuth } from "../../context/AuthContext"
import { useRouter, useLocalSearchParams } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { formatCurrency } from "../../utils/currency"

export default function MenuScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const { state: appState, dispatch, placeOrderToSupabase } = useApp()
  const { state: authState } = useAuth()
  const { dishes, cart } = appState
  
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [addedDishId, setAddedDishId] = useState<string | null>(null)
  const [receptionistCart, setReceptionistCart] = useState<any[]>([]) // 🆕 Separate cart for receptionist

  const isReceptionist = authState.currentUser?.role === 'receptionist'
  
  // 🆕 Extract order context from params
  const orderType = params.orderType as string // 'walk-in' or 'for-customer'
  const customerId = params.customerId as string
  const customerName = params.customerName as string
  const customerEmail = params.customerEmail as string
  const customerNumber = params.customerNumber as string
  const paymentType = params.paymentType as 'cash' | 'monthly'

  const isWalkIn = orderType === 'walk-in'
  const isForCustomer = orderType === 'for-customer'
  const isReceptionistOrder = isReceptionist && (isWalkIn || isForCustomer)

  // 🆕 Use appropriate cart
  const activeCart = isReceptionistOrder ? receptionistCart : cart
  const cartItemCount = activeCart.reduce((sum, item) => sum + item.quantity, 0)

  useEffect(() => {
    console.log('🔍 Menu Screen Context:');
    console.log('- Is Receptionist:', isReceptionist);
    console.log('- Order Type:', orderType);
    console.log('- Customer ID:', customerId);
    console.log('- Customer Name:', customerName);
    console.log('- Is Walk-in:', isWalkIn);
    console.log('- Is For Customer:', isForCustomer);
  }, [orderType, customerId, customerName]);

  // 🆕 Handle add to cart based on context
  const handleAddToCart = (dish: any) => {
    if (isReceptionistOrder) {
      // Add to receptionist's temporary cart
      const existingItem = receptionistCart.find(item => item.dish.id === dish.id);
      if (existingItem) {
        setReceptionistCart(receptionistCart.map(item =>
          item.dish.id === dish.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        setReceptionistCart([...receptionistCart, { dish, quantity: 1 }]);
      }
    } else {
      // Normal customer flow
      dispatch({ type: "ADD_TO_CART", dish })
    }

    setAddedDishId(dish.id)
    setTimeout(() => setAddedDishId(null), 1000)
  }

  // 🆕 Handle viewing cart
  const handleViewCart = () => {
    if (isReceptionistOrder) {
      // Show receptionist checkout
      if (receptionistCart.length === 0) {
        Alert.alert('Empty Cart', 'Please add items before proceeding to checkout');
        return;
      }
      
      // Navigate to checkout with context
      Alert.alert(
        'Checkout',
        `Ready to place order for ${isWalkIn ? 'walk-in customer' : customerName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Place Order',
            onPress: handlePlaceReceptionistOrder
          }
        ]
      );
    } else {
      // Normal customer cart
      router.push("/(tabs)/cart")
    }
  }

  // 🆕 Place order as receptionist
  const handlePlaceReceptionistOrder = async () => {
    if (receptionistCart.length === 0) return;

    const totalAmount = receptionistCart.reduce(
      (sum, item) => sum + item.dish.price * item.quantity,
      0
    );

    // 🔥 FIX: Use special walk-in customer UUID instead of string
    const WALK_IN_CUSTOMER_ID = '00000000-0000-0000-0000-000000000001';

    const order: any = {
      id: Date.now().toString(),
      customerId: isWalkIn ? WALK_IN_CUSTOMER_ID : customerId,
      customerName: isWalkIn ? `Walk-in #${Date.now().toString().slice(-4)}` : customerName,
      customerEmail: isWalkIn ? 'walk-in@restaurant.local' : customerEmail,
      items: receptionistCart,
      totalAmount,
      status: isWalkIn ? 'approved' : 'pending', // Auto-approve walk-ins
      paymentType: isWalkIn ? 'cash' : paymentType,
      createdAt: new Date().toISOString(),
      placedBy: authState.currentUser?.id,
      placedByName: authState.currentUser?.name,
      isWalkIn: isWalkIn,
    };

    try {
      await placeOrderToSupabase(order);
      
      Alert.alert(
        'Success! ✅',
        isWalkIn 
          ? 'Walk-in order placed and approved!'
          : `Order placed for ${customerName}. Awaiting approval.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setReceptionistCart([]);
              router.push('/(tabs)/reception-dashboard');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Order placement error:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    }
  };

  // 🆕 Handle back navigation
  const handleBack = () => {
    if (isReceptionistOrder) {
      if (receptionistCart.length > 0) {
        Alert.alert(
          'Discard Order?',
          'Items in cart will be lost',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Discard',
              style: 'destructive',
              onPress: () => {
                setReceptionistCart([]);
                router.back();
              }
            }
          ]
        );
      } else {
        router.back();
      }
    }
  };

  const categories = useMemo(() => {
    const availableDishes = dishes.filter((dish) => dish.available)
    const uniqueCategories = [...new Set(availableDishes.map((dish) => dish.category))]
    return uniqueCategories.sort()
  }, [dishes])

  const filteredDishes = useMemo(() => {
    const availableDishes = dishes.filter((dish) => dish.available)
    if (selectedCategory === "All") {
      return availableDishes
    }
    return availableDishes.filter((dish) => dish.category === selectedCategory)
  }, [selectedCategory, dishes])

  return (
    <View style={styles.container}>
      {/* Enhanced Header with Gradient */}
      <LinearGradient
        colors={isReceptionistOrder ? ["#10B981", "#059669", "#047857"] : ["#F97316", "#FB923C", "#FDBA74"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            {/* 🆕 Show back button for receptionist */}
            {isReceptionistOrder && (
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={handleBack}
                activeOpacity={0.8}
              >
                <ArrowLeft size={24} color="#fff" strokeWidth={2.5} />
              </TouchableOpacity>
            )}
            
            <View>
              <Text style={styles.title}>
                {isWalkIn ? 'Walk-in Order' : isForCustomer ? 'Customer Order' : 'Our Menu'}
              </Text>
              <Text style={styles.subtitle}>
                {isWalkIn 
                  ? 'Quick checkout for walk-in customer' 
                  : isForCustomer 
                    ? `Placing order for ${customerName} (#${customerNumber})`
                    : 'Delicious dishes made with love'
                }
              </Text>
            </View>
          </View>

          {/* Floating Cart Button */}
          <TouchableOpacity 
            style={[styles.cartButton, isReceptionistOrder && styles.cartButtonReceptionist]} 
            activeOpacity={0.8} 
            onPress={handleViewCart}
          >
            <ShoppingCart 
              size={24} 
              color={isReceptionistOrder ? "#10B981" : "#F97316"} 
              strokeWidth={2.5} 
            />
            {cartItemCount > 0 && (
              <View style={[styles.cartBadge, isReceptionistOrder && styles.cartBadgeReceptionist]}>
                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

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
        {filteredDishes.map((dish) => {
          const isAdded = addedDishId === dish.id

          return (
            <View key={dish.id} style={styles.dishCard}>
              <LinearGradient
                colors={["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.glassCard}
              >
                <View style={styles.imageContainer}>
                  <Image source={{ uri: dish.image }} style={styles.dishImage} />
                  <LinearGradient colors={["transparent", "rgba(0,0,0,0.4)"]} style={styles.imageGradient} />

                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{dish.category}</Text>
                  </View>

                  <View style={styles.availabilityBadge}>
                    <CheckCircle size={14} color="#10B981" strokeWidth={2.5} />
                    <Text style={styles.availabilityText}>Available</Text>
                  </View>
                </View>

                <View style={styles.dishContent}>
                  <View style={styles.dishHeader}>
                    <View style={styles.dishInfo}>
                      <Text style={styles.dishName}>{dish.name}</Text>
                      <Text style={styles.dishDescription} numberOfLines={2}>
                        {dish.description}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.dishFooter}>
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceLabel}>PRICE</Text>
                      <Text style={styles.dishPrice}>{formatCurrency(dish.price)}</Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.addButton, isAdded && styles.addButtonSuccess]}
                      onPress={() => handleAddToCart(dish)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={isAdded ? ["#10B981", "#059669"] : 
                                isReceptionistOrder ? ["#10B981", "#059669"] : ["#F97316", "#EA580C"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.addButtonGradient}
                      >
                        <Plus size={22} color="#fff" strokeWidth={3} />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </View>
          )
        })}

        {filteredDishes.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No dishes available</Text>
              <Text style={styles.emptySubtext}>Check back later for new items</Text>
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FEF3E2",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
    letterSpacing: -0.5,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.95)",
    fontWeight: "500",
  },
  cartButton: {
    backgroundColor: "#fff",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: "relative",
  },
  cartButtonReceptionist: {
    shadowColor: "#10B981",
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    borderWidth: 3,
    borderColor: "#fff",
  },
  cartBadgeReceptionist: {
    backgroundColor: "#10B981",
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  dishCard: {
    marginBottom: 20,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  glassCard: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 200,
  },
  dishImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  categoryBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(249, 115, 22, 0.95)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  categoryBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  availabilityBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  availabilityText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "700",
  },
  dishContent: {
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  dishHeader: {
    marginBottom: 16,
  },
  dishInfo: {
    flex: 1,
  },
  dishName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  dishDescription: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
  },
  dishFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  dishPrice: {
    fontSize: 28,
    fontWeight: "900",
    color: "#F97316",
    letterSpacing: -1,
  },
  addButton: {
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  addButtonSuccess: {
    shadowColor: "#10B981",
  },
  addButtonGradient: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyCard: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6B7280",
  },
  bottomPadding: {
    height: 20,
  },
})