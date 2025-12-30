// app/(tabs)/_layout.tsx - UPDATED VERSION
import React from 'react';
import { Tabs } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { ChefHat, ShoppingCart, Clock, User, LayoutDashboard, Search, CheckSquare } from 'lucide-react-native';
import { AppProvider } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
  const { logout, state } = useAuth();
  const currentUser = state.currentUser;
  const isReceptionist = currentUser?.role === 'receptionist';

  const handleLogout = () => {
    logout();
  };

  return (
    <AppProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopColor: '#E5E7EB',
            borderTopWidth: 1,
            paddingTop: 8,
            paddingBottom: 8,
            height: 70,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginTop: 4,
          },
          tabBarActiveTintColor: isReceptionist ? '#10B981' : '#F97316',
          tabBarInactiveTintColor: '#6B7280',
          
          tabBarButton: (props) => {
            const { disabled, ...otherProps } = props;
            const fixedProps = { ...otherProps, disabled: disabled ?? undefined };

            if (props.accessibilityLabel === 'Profile' || props.accessibilityLabel === 'profile') {
              return (
                <TouchableOpacity
                  {...fixedProps}
                  onLongPress={handleLogout}
                  delayLongPress={1000}
                />
              );
            }
            
            return <TouchableOpacity {...fixedProps} />;
          },
        }}
      >
        {/* 🆕 MENU - NOW VISIBLE TO BOTH ROLES */}
        <Tabs.Screen
          name="index"
          options={{
            title: isReceptionist ? 'Place Order' : 'Menu', // 🆕 Different label for receptionist
            // href: undefined, // 🆕 REMOVED: Now visible to everyone
            tabBarIcon: ({ size, color }) => (
              <ChefHat size={size} color={color} strokeWidth={2} />
            ),
          }}
        />

        {/* CUSTOMER-ONLY SCREENS */}
        <Tabs.Screen
          name="cart"
          options={{
            title: 'Cart',
            href: isReceptionist ? null : undefined, // ✅ Hide from receptionist
            tabBarIcon: ({ size, color }) => (
              <ShoppingCart size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Orders',
            href: isReceptionist ? null : undefined, // ✅ Hide from receptionist
            tabBarIcon: ({ size, color }) => (
              <Clock size={size} color={color} strokeWidth={2} />
            ),
          }}
        />

        {/* RECEPTIONIST-ONLY SCREENS */}
        <Tabs.Screen
          name="reception-dashboard"
          options={{
            title: 'Dashboard',
            href: isReceptionist ? undefined : null, // ✅ Hide from customer
            tabBarIcon: ({ size, color }) => (
              <LayoutDashboard size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="customer-search"
          options={{
            title: 'Search',
            href: isReceptionist ? undefined : null, // ✅ Hide from customer
            tabBarIcon: ({ size, color }) => (
              <Search size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="pending-orders"
          options={{
            title: 'Approve',
            href: isReceptionist ? undefined : null, // ✅ Hide from customer
            tabBarIcon: ({ size, color }) => (
              <CheckSquare size={size} color={color} strokeWidth={2} />
            ),
          }}
        />

        {/* SHARED SCREEN */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ size, color }) => (
              <User size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
      </Tabs>
    </AppProvider>
  );
}