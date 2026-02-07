// components/DrawerButton.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Animated, Dimensions } from 'react-native';
import { Menu, X, Users, Receipt, Settings as SettingsIcon, LogOut, UserCog } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter, Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function DrawerButton() {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const isMounted = useRef(true);
  const translateX = useRef(new Animated.Value(0)).current;
  const drawerWidth = Math.round(Dimensions.get('window').width * 0.78);
  const { state: authState, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleLogout = () => {
    handleCloseImmediate();
    logout();
    router.replace('/portal-selection');
  };

  const navigateTo = (route: Href) => {
    handleCloseImmediate();
    router.push(route);
  };

  const handleOpen = () => {
    translateX.setValue(-drawerWidth);
    setDrawerVisible(true);
    Animated.timing(translateX, {
      toValue: 0,
      duration: 240,
      useNativeDriver: true,
    }).start();
  };

  const handleClose = () => {
    translateX.stopAnimation();
    Animated.timing(translateX, {
      toValue: -drawerWidth,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      if (isMounted.current) setDrawerVisible(false);
    });
  };

  const handleCloseImmediate = () => {
    translateX.stopAnimation();
    translateX.setValue(-drawerWidth);
    if (isMounted.current) setDrawerVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={handleOpen}
      >
        <Menu size={24} color="#1F2937" strokeWidth={2} />
      </TouchableOpacity>

      <Modal
        visible={drawerVisible}
        animationType="none"
        transparent={true}
        onRequestClose={() => handleClose()}
      >
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={() => handleClose()}
        >
          <Animated.View
            style={[styles.drawerContainer, { width: drawerWidth, transform: [{ translateX }] }]}
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <LinearGradient
              colors={['#f8a889', '#2F4A3F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.drawerHeader}
            >
              <TouchableOpacity 
                onPress={() => handleClose()} 
                style={styles.closeButton}
              >
                <X size={24} color="#fff" strokeWidth={2} />
              </TouchableOpacity>
              
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {authState.currentUser?.name?.charAt(0).toUpperCase() || 'A'}
                </Text>
              </View>
              
              <Text style={styles.userName}>
                {authState.currentUser?.name || 'Admin'}
              </Text>
              <Text style={styles.userEmail}>
                {authState.currentUser?.email || ''}
              </Text>
            </LinearGradient>

            {/* Menu Items */}
            <ScrollView style={styles.menuItems}>
              <Text style={styles.menuSection}>More Options</Text>
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => navigateTo('/(admin)/customers')}
              >
                <Users size={22} color="#6B7280" strokeWidth={2} />
                <Text style={styles.menuItemText}>Customers</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => navigateTo('/(admin)/hr')}
              >
                <UserCog size={22} color="#6B7280" strokeWidth={2} />
                <Text style={styles.menuItemText}>HR Management</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => navigateTo('/(admin)/monthly-bills')}
              >
                <Receipt size={22} color="#6B7280" strokeWidth={2} />
                <Text style={styles.menuItemText}>Monthly Bills</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => navigateTo('/(admin)/settings')}
              >
                <SettingsIcon size={22} color="#6B7280" strokeWidth={2} />
                <Text style={styles.menuItemText}>Settings</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Logout */}
            <View style={styles.drawerFooter}>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <LogOut size={20} color="#EF4444" strokeWidth={2} />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F7F3EE',
    borderWidth: 1,
    borderColor: 'rgba(59, 93, 79, 0.15)',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  drawerContainer: {
    backgroundColor: '#F7F3EE',
    height: '100%',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  drawerHeader: {
    backgroundColor: '#3B5D4F',
    padding: 24,
    paddingTop: 32,
    paddingBottom: 18,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 10,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F7F3EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B5D4F',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  menuItems: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  menuSection: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8B8A85',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(59, 93, 79, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 16,
    fontWeight: '600',
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 93, 79, 0.15)',
    padding: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FDE8E8',
  },
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    marginLeft: 12,
    fontWeight: '600',
  },
});
