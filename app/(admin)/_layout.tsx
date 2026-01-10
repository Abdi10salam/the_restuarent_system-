// app/(admin)/_layout.tsx - FINAL VERSION
import React from 'react';
import { Tabs } from 'expo-router';
import { ChartBar as BarChart3, ClipboardList, ChefHat, UserCog } from 'lucide-react-native';
import { AppProvider } from '../../context/AppContext';
import DrawerButton from '../../components/DrawerButton';

export default function AdminTabLayout() {
  return (
    <AppProvider>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#fff',
            elevation: 2,
            shadowOpacity: 0.1,
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
            color: '#1F2937',
          },
          headerLeft: () => <DrawerButton />,
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
          tabBarActiveTintColor: '#10B981',
          tabBarInactiveTintColor: '#6B7280',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ size, color }) => (
              <BarChart3 size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Orders',
            tabBarIcon: ({ size, color }) => (
              <ClipboardList size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="menu"
          options={{
            title: 'Menu',
            tabBarIcon: ({ size, color }) => (
              <ChefHat size={size} color={color} strokeWidth={2} />
            ),
          }}
        />

        {/* Hide these from tabs - accessible via drawer */}
        <Tabs.Screen
          name="customers"
          options={{
            href: null,
          }}
        />
        
        <Tabs.Screen
          name="monthly-bills"
          options={{
            href: null,
          }}
        />
        
        <Tabs.Screen
          name="settings"
          options={{
            href: null,
          }}
        />

        <Tabs.Screen
  name="hr"
  options={{
    title: 'HR',
    href: null, // 🆕 Add this line to hide from bottom tabs
    tabBarIcon: ({ size, color }) => (
      <UserCog size={size} color={color} strokeWidth={2} />
    ),
  }}
/>
      </Tabs>
    </AppProvider>
  );
}