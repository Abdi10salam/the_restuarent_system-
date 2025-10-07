import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { state } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Mark component as mounted
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const timeout = setTimeout(() => {
      try {
        if (state.isAuthenticated) {
          if (state.userType === 'admin') {
            router.replace('/(admin)');
          } else {
            router.replace('/(tabs)');
          }
        } else {
          router.replace('/portal-selection');
        }
      } catch (error) {
        console.log('Navigation error:', error);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [isMounted, state.isAuthenticated, state.userType]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
      <ActivityIndicator size="large" color="#F97316" />
    </View>
  );
}