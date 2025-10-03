import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ChefHat, Shield, Users, Settings } from 'lucide-react-native';

export default function PortalSelectionScreen() {
  const router = useRouter();

  const handlePortalSelect = (portal: 'customer' | 'admin') => {
    router.push(`/login?portal=${portal}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ChefHat size={48} color="#F97316" strokeWidth={2} />
        <Text style={styles.title}>Restaurant Portal</Text>
        <Text style={styles.subtitle}>Choose your access level</Text>
      </View>

      <View style={styles.portalsContainer}>
        <TouchableOpacity
          style={[styles.portalCard, styles.customerCard]}
          onPress={() => handlePortalSelect('customer')}
        >
          <View style={styles.portalIcon}>
            <Users size={32} color="#F97316" strokeWidth={2} />
          </View>
          <Text style={styles.portalTitle}>Customer Portal</Text>
          <Text style={styles.portalDescription}>
            Browse menu, place orders, and track your order status
          </Text>
          <View style={styles.portalFeatures}>
            <Text style={styles.featureText}>• View menu & place orders</Text>
            <Text style={styles.featureText}>• Track order status</Text>
            <Text style={styles.featureText}>• Manage payment options</Text>
            <Text style={styles.featureText}>• View order history</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.portalCard, styles.adminCard]}
          onPress={() => handlePortalSelect('admin')}
        >
          <View style={styles.portalIcon}>
            <Shield size={32} color="#10B981" strokeWidth={2} />
          </View>
          <Text style={styles.portalTitle}>Admin Portal</Text>
          <Text style={styles.portalDescription}>
            Manage orders, approve payments, and oversee operations
          </Text>
          <View style={styles.portalFeatures}>
            <Text style={styles.featureText}>• Approve/reject orders</Text>
            <Text style={styles.featureText}>• Manage menu items</Text>
            <Text style={styles.featureText}>• View analytics</Text>
            <Text style={styles.featureText}>• Handle billing</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Demo Credentials:
        </Text>
        <Text style={styles.credentialsText}>
          Customer: customer@test.com / password
        </Text>
        <Text style={styles.credentialsText}>
          Admin: admin@test.com / admin
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 24,
    paddingTop: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  portalsContainer: {
    gap: 24,
    marginBottom: 48,
  },
  portalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  customerCard: {
    borderColor: '#F97316',
  },
  adminCard: {
    borderColor: '#10B981',
  },
  portalIcon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  portalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  portalDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  portalFeatures: {
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  footer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  credentialsText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
});