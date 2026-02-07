// app/(tabs)/_layout.tsx - UPDATED WITH HIDDEN PROFILE TAB
import React from 'react';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ChefHat, ShoppingCart, Clock, User, LayoutDashboard, Search, CheckSquare } from 'lucide-react-native';
import { AppProvider } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
  const { state } = useAuth();
  const currentUser = state.currentUser;
  const isReceptionist = currentUser?.role === 'receptionist';
  const renderTabIcon =
    (Icon: any) =>
    ({ size, color, focused }: { size: number; color: string; focused: boolean }) => {
      if (!focused) return <Icon size={size} color={color} strokeWidth={2} />;
      return (
        <LinearGradient
          colors={['#ecc1b3', '#2F4A3F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 8, borderRadius: 14 }}
        >
          <Icon size={size} color="#fff" strokeWidth={2} />
        </LinearGradient>
      );
    };

  return (
    <AppProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            paddingTop: 8,
            paddingBottom: 10,
            height: 74,
            marginHorizontal: 16,
            marginBottom: 18,
            borderRadius: 26,
            position: 'absolute',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 10,
          },
          tabBarBackground: () => (
            <LinearGradient
              colors={['#F7F3EE', '#fad4a1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, borderRadius: 26, overflow: 'hidden' }}
            >
              <BlurView intensity={55} tint="light" style={{ flex: 1 }} />
            </LinearGradient>
          ),
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginTop: 4,
          },
          tabBarActiveTintColor: '#3B5D4F',
          tabBarInactiveTintColor: '#6B7280',
          
          // Note: expo-router does not allow using `href` with `tabBarButton`.
        }}
      >
        {/* MENU - VISIBLE TO BOTH ROLES */}
        <Tabs.Screen
          name="index"
          options={{
            title: isReceptionist ? 'Place Order' : 'Menu',
            tabBarIcon: renderTabIcon(ChefHat),
          }}
        />

        {/* CUSTOMER-ONLY SCREENS */}
        <Tabs.Screen
          name="cart"
          options={{
            title: 'Cart',
            href: isReceptionist ? null : undefined,
            tabBarIcon: renderTabIcon(ShoppingCart),
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Orders',
            href: isReceptionist ? null : undefined,
            tabBarIcon: renderTabIcon(Clock),
          }}
        />

        {/* RECEPTIONIST-ONLY SCREENS */}
        <Tabs.Screen
          name="reception-dashboard"
          options={{
            title: 'Dashboard',
            href: isReceptionist ? undefined : null,
            tabBarIcon: renderTabIcon(LayoutDashboard),
          }}
        />
        <Tabs.Screen
          name="customer-search"
          options={{
            title: 'Search',
            href: isReceptionist ? undefined : null,
            tabBarIcon: renderTabIcon(Search),
          }}
        />
        <Tabs.Screen
          name="pending-orders"
          options={{
            title: 'Approve',
            href: isReceptionist ? undefined : null,
            tabBarIcon: renderTabIcon(CheckSquare),
          }}
        />

        {/* 🆕 PROFILE - HIDDEN FROM TAB BAR (accessible via header) */}
        <Tabs.Screen
          name="profile"
          options={{
            href: null, // Hide from tab bar completely
          }}
        />
      </Tabs>
    </AppProvider>
  );
}
