import React from 'react';
import { Tabs } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChefHat, ShoppingCart, Clock, User, LogOut } from 'lucide-react-native';
import { AppProvider } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/portal-selection');
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
          tabBarActiveTintColor: '#F97316',
          tabBarInactiveTintColor: '#6B7280',
          tabBarButton: (props) => {
            if (props.accessibilityLabel === 'Profile') {
              return (
                <TouchableOpacity
                  {...props}
                  onLongPress={handleLogout}
                  delayLongPress={1000}
                />
              );
            }
            return <TouchableOpacity {...props} />;
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Menu',
            tabBarIcon: ({ size, color }) => (
              <ChefHat size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: 'Cart',
            tabBarIcon: ({ size, color }) => (
              <ShoppingCart size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Orders',
            tabBarIcon: ({ size, color }) => (
              <Clock size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
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