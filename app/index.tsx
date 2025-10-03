import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    
    if (state.isAuthenticated) {
      if (state.userType === 'admin') {
        router.replace('/(admin)');
      } else {
        router.replace('/(tabs)');
      }
    } else {
      router.replace('/portal-selection');
    }
  }, [state.isAuthenticated, state.userType, router.isReady]);
  
  return null;
}