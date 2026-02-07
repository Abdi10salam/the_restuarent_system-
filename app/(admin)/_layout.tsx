// app/(admin)/_layout.tsx 
import React from 'react';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ChartBar as BarChart3, ClipboardList, ChefHat, UserCog } from 'lucide-react-native';
import { AppProvider } from '../../context/AppContext';
import DrawerButton from '../../components/DrawerButton';

export default function AdminTabLayout() {
  const renderTabIcon =
    (Icon: any) =>
    ({ size, color, focused }: { size: number; color: string; focused: boolean }) => {
      if (!focused) return <Icon size={size} color={color} strokeWidth={2} />;
      return (
        <LinearGradient
          colors={['#ffe0d9', '#2F4A3F']}
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
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: renderTabIcon(BarChart3),
          }}
        />
        
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Orders',
            tabBarIcon: renderTabIcon(ClipboardList),
          }}
        />
        
        <Tabs.Screen
          name="menu"
          options={{
            title: 'Menu',
            tabBarIcon: renderTabIcon(ChefHat),
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
          name="overdue-bills"
          options={{
            href: null,
          }}
        />

        <Tabs.Screen
          name="revenue-details"
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
