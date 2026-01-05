// components/DrawerButton.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Menu, X, Users, Receipt, Settings as SettingsIcon, LogOut } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

export default function DrawerButton() {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { state: authState, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    setDrawerVisible(false);
    logout();
    router.replace('/portal-selection');
  };

  const navigateTo = (route: string) => {
    setDrawerVisible(false);
    router.push(route as any);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setDrawerVisible(true)}
      >
        <Menu size={24} color="#1F2937" strokeWidth={2} />
      </TouchableOpacity>

      <Modal
        visible={drawerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDrawerVisible(false)}
      >
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={() => setDrawerVisible(false)}
        >
          <View style={styles.drawerContainer} onStartShouldSetResponder={() => true}>
            {/* Header */}
            <View style={styles.drawerHeader}>
              <TouchableOpacity 
                onPress={() => setDrawerVisible(false)} 
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
            </View>

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
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    marginLeft: 16,
    padding: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawerContainer: {
    backgroundColor: '#F9FAFB',
    height: '75%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  drawerHeader: {
    backgroundColor: '#10B981',
    padding: 24,
    paddingTop: 48,
    paddingBottom: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 10,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#E0F2F1',
  },
  menuItems: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  menuSection: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
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
    borderTopColor: '#E5E7EB',
    padding: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
  },
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    marginLeft: 12,
    fontWeight: '600',
  },
});