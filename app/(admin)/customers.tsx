// app/(admin)/customers.tsx - WITH PHONE NUMBER & PROFILE PHOTO
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Modal, ActivityIndicator, Image } from 'react-native';
import { Users, DollarSign, Receipt, Plus, Mail, User, CreditCard, Clock, UserCog, X, Phone, Camera, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSignUp } from '@clerk/clerk-expo';
import { useApp } from '../../context/AppContext';
import { Customer } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { uploadProfileImage, deleteProfileImage } from '../lib/supabase';

export default function AdminCustomersScreen() {
  const { state, dispatch, addCustomerToSupabase } = useApp();
  const { customers, orders } = state;
  const { signUp } = useSignUp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showStaffOrders, setShowStaffOrders] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '', // 🆕 NEW
    profilePhoto: '', // 🆕 NEW
    role: 'customer' as 'customer' | 'receptionist',
    paymentType: 'monthly' as 'cash' | 'monthly'
  });

  // 🆕 Request permissions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload images.');
      return false;
    }
    return true;
  };

  // 🆕 Pick image from gallery
  const pickProfilePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for profile photos
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const localUri = result.assets[0].uri;
        
        // Show local image immediately
        setNewCustomer(prev => ({ ...prev, profilePhoto: localUri }));
        setIsUploadingPhoto(true);
        
        // Upload to Supabase
        const imageUrl = await uploadProfileImage(localUri, newCustomer.email || 'user');

        if (imageUrl) {
          setNewCustomer(prev => ({ ...prev, profilePhoto: imageUrl }));
          Alert.alert('Success', 'Photo uploaded successfully!');
        } else {
          setNewCustomer(prev => ({ ...prev, profilePhoto: '' }));
          Alert.alert('Error', 'Failed to upload photo. Please try again.');
        }
        
        setIsUploadingPhoto(false);
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert('Error', 'Failed to pick photo.');
      setIsUploadingPhoto(false);
    }
  };

  // 🆕 Take photo with camera
  const takeProfilePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your camera to take photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const localUri = result.assets[0].uri;
        
        setNewCustomer(prev => ({ ...prev, profilePhoto: localUri }));
        setIsUploadingPhoto(true);
        
        const imageUrl = await uploadProfileImage(localUri, newCustomer.email || 'user');

        if (imageUrl) {
          setNewCustomer(prev => ({ ...prev, profilePhoto: imageUrl }));
          Alert.alert('Success', 'Photo uploaded successfully!');
        } else {
          setNewCustomer(prev => ({ ...prev, profilePhoto: '' }));
          Alert.alert('Error', 'Failed to upload photo. Please try again.');
        }
        
        setIsUploadingPhoto(false);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo.');
      setIsUploadingPhoto(false);
    }
  };

  // 🆕 Show photo options
  const showPhotoOptions = () => {
    Alert.alert(
      'Profile Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takeProfilePhoto },
        { text: 'Choose from Gallery', onPress: pickProfilePhoto },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.email) {
      Alert.alert('Error', 'Please fill in name and email');
      return;
    }

    if (!newCustomer.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // 🆕 Validate phone number (optional but recommended format)
    if (newCustomer.phone && !/^[0-9+\s()-]+$/.test(newCustomer.phone)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    const existingCustomer = customers.find(c => c.email === newCustomer.email);
    if (existingCustomer) {
      Alert.alert('Error', 'A user with this email already exists');
      return;
    }

    setIsSubmitting(true);

    try {
      const customer: Customer = {
        id: Date.now().toString(),
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone || undefined, // 🆕 NEW
        profilePhoto: newCustomer.profilePhoto || undefined, // 🆕 NEW
        customerNumber: 0,
        role: newCustomer.role,
        paymentType: newCustomer.paymentType,
        monthlyBalance: 0,
        totalSpent: 0,
        isFirstLogin: true,
        registeredAt: new Date().toISOString(),
      };

      const customerNumber = await addCustomerToSupabase(customer, 'admin@test.com');

      setNewCustomer({ 
        name: '', 
        email: '', 
        phone: '', 
        profilePhoto: '',
        role: 'customer', 
        paymentType: 'monthly' 
      });
      setShowAddModal(false);

      Alert.alert(
        'Success',
        `${newCustomer.role === 'receptionist' ? 'Receptionist' : 'Customer'} registered!\nAccount Number: ${customerNumber}\nThey can now login with ${newCustomer.email}`,
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      console.error('Error creating user:', err);
      Alert.alert('Error', err.message || 'Failed to register user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateMonthlyBill = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer || customer.monthlyBalance === 0) {
      Alert.alert('Info', 'No outstanding balance for this customer');
      return;
    }

    dispatch({ type: 'GENERATE_MONTHLY_BILL', customerId });
    Alert.alert('Success', 'Monthly bill generated successfully!');
  };

  const getCustomerStats = (customerId: string) => {
    const customerOrders = orders.filter(order => order.customerId === customerId);
    const completedOrders = customerOrders.filter(order => order.status === 'approved');
    return {
      totalOrders: completedOrders.length,
      pendingOrders: customerOrders.filter(order => order.status === 'pending').length,
      revenue: completedOrders.reduce((sum, o) => sum + o.totalAmount, 0),
    };
  };

  const getStaffStats = (staffId: string) => {
    const staffOrders = orders.filter(order => order.placedBy === staffId);
    return {
      totalOrders: staffOrders.length,
      pendingOrders: staffOrders.filter(o => o.status === 'pending').length,
      walkInOrders: staffOrders.filter(o => o.isWalkIn).length,
      customerOrders: staffOrders.filter(o => !o.isWalkIn).length,
      approvedOrders: staffOrders.filter(o => o.status === 'approved').length,
      revenue: staffOrders
        .filter(o => o.status === 'approved')
        .reduce((sum, o) => sum + o.totalAmount, 0),
      orders: staffOrders.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>User Management</Text>
          <Text style={styles.subtitle}>
            {customers.filter(c => c.role === 'customer').length} customers • {customers.filter(c => c.role === 'receptionist').length} receptionists
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {customers.map((customer) => {
          const isReceptionist = customer.role === 'receptionist';
          const stats = isReceptionist 
            ? getStaffStats(customer.id)
            : getCustomerStats(customer.id);
          
          return (
            <TouchableOpacity
              key={customer.id}
              style={styles.customerCard}
              onPress={() => isReceptionist && setShowStaffOrders(customer.id)}
              activeOpacity={isReceptionist ? 0.7 : 1}
            >
              <View style={styles.customerHeader}>
                <View style={styles.customerMainInfo}>
                  {/* 🆕 Profile Photo */}
                  {customer.profilePhoto ? (
                    <Image 
                      source={{ uri: customer.profilePhoto }} 
                      style={styles.profilePhoto}
                    />
                  ) : (
                    <View style={styles.profilePhotoPlaceholder}>
                      <User size={24} color="#6B7280" strokeWidth={2} />
                    </View>
                  )}
                  
                  <View style={styles.customerInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.customerName}>{customer.name}</Text>
                      {isReceptionist && (
                        <View style={styles.receptionistBadge}>
                          <UserCog size={12} color="#fff" strokeWidth={2} />
                          <Text style={styles.receptionistBadgeText}>Staff</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.customerEmail}>{customer.email}</Text>
                    {/* 🆕 Phone Number Display */}
                    {customer.phone && (
                      <Text style={styles.customerPhone}>📱 {customer.phone}</Text>
                    )}
                    <Text style={styles.customerNumber}>#{customer.customerNumber}</Text>
                    <View style={styles.customerMeta}>
                      {!isReceptionist && (
                        <Text style={[
                          styles.paymentType,
                          { backgroundColor: customer.paymentType === 'monthly' ? '#DBEAFE' : '#D1FAE5' }
                        ]}>
                          {customer.paymentType === 'monthly' ? 'Monthly Billing' : 'Cash Only'}
                        </Text>
                      )}
                      {customer.isFirstLogin && (
                        <Text style={styles.firstLoginBadge}>First Login Pending</Text>
                      )}
                    </View>
                  </View>
                </View>
                
                <View style={styles.customerStats}>
                  {isReceptionist ? (
                    <>
                      <View style={styles.statItem}>
                        <Receipt size={16} color="#10B981" strokeWidth={2} />
                        <Text style={styles.statText}>{stats.totalOrders} orders</Text>
                      </View>
                      <View style={styles.statItem}>
                        <DollarSign size={16} color="#F97316" strokeWidth={2} />
                        <Text style={styles.statText}>{formatCurrency(stats.revenue)}</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.statItem}>
                        <Receipt size={16} color="#F97316" strokeWidth={2} />
                        <Text style={styles.statText}>{stats.totalOrders} orders</Text>
                      </View>
                      <View style={styles.statItem}>
                        <DollarSign size={16} color="#10B981" strokeWidth={2} />
                        <Text style={styles.statText}>{formatCurrency(customer.totalSpent)} spent</Text>
                      </View>
                      {stats.pendingOrders > 0 && (
                        <View style={styles.statItem}>
                          <Clock size={16} color="#F59E0B" strokeWidth={2} />
                          <Text style={styles.statText}>{stats.pendingOrders} pending</Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              </View>

              {!isReceptionist && customer.monthlyBalance > 0 && (
                <View style={styles.balanceSection}>
                  <View style={styles.balanceInfo}>
                    <Text style={styles.balanceLabel}>Outstanding Balance</Text>
                    <Text style={styles.balanceAmount}>{formatCurrency(customer.monthlyBalance)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.billButton}
                    onPress={() => generateMonthlyBill(customer.id)}
                  >
                    <Text style={styles.billButtonText}>Generate Bill</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {customers.length === 0 && (
          <View style={styles.emptyState}>
            <Users size={64} color="#D1D5DB" strokeWidth={1} />
            <Text style={styles.emptyText}>No users registered</Text>
            <Text style={styles.emptySubtext}>Add your first user to get started</Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Register User Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => !isSubmitting && setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Register New User</Text>
                <Text style={styles.modalDescription}>
                  User will receive an OTP when they first login
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {/* 🆕 Profile Photo Upload */}
              <View style={styles.photoUploadSection}>
                <Text style={styles.photoLabel}>Profile Photo (Optional)</Text>
                {newCustomer.profilePhoto ? (
                  <View style={styles.photoPreviewContainer}>
                    <Image 
                      source={{ uri: newCustomer.profilePhoto }} 
                      style={styles.photoPreview}
                    />
                    {isUploadingPhoto && (
                      <View style={styles.uploadingOverlay}>
                        <ActivityIndicator size="large" color="#fff" />
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.changePhotoButton}
                      onPress={showPhotoOptions}
                      disabled={isUploadingPhoto || isSubmitting}
                    >
                      <Upload size={14} color="#fff" strokeWidth={2} />
                      <Text style={styles.changePhotoText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.photoUploadButton}
                    onPress={showPhotoOptions}
                    disabled={isUploadingPhoto || isSubmitting}
                  >
                    {isUploadingPhoto ? (
                      <ActivityIndicator color="#10B981" />
                    ) : (
                      <>
                        <Camera size={24} color="#10B981" strokeWidth={2} />
                        <Text style={styles.photoUploadText}>Add Photo</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.inputContainer}>
                <User size={20} color="#6B7280" strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name *"
                  value={newCustomer.name}
                  onChangeText={(text) => setNewCustomer(prev => ({ ...prev, name: text }))}
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.inputContainer}>
                <Mail size={20} color="#6B7280" strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address *"
                  value={newCustomer.email}
                  onChangeText={(text) => setNewCustomer(prev => ({ ...prev, email: text }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isSubmitting}
                />
              </View>

              {/* 🆕 Phone Number Input */}
              <View style={styles.inputContainer}>
                <Phone size={20} color="#6B7280" strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number (Optional)"
                  value={newCustomer.phone}
                  onChangeText={(text) => setNewCustomer(prev => ({ ...prev, phone: text }))}
                  keyboardType="phone-pad"
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.roleTypeContainer}>
                <Text style={styles.roleTypeLabel}>Account Type:</Text>
                <View style={styles.roleTypeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.roleTypeButton,
                      newCustomer.role === 'customer' && styles.selectedRoleType
                    ]}
                    onPress={() => setNewCustomer(prev => ({ ...prev, role: 'customer' }))}
                    disabled={isSubmitting}
                  >
                    <Users size={16} color={newCustomer.role === 'customer' ? '#fff' : '#6B7280'} strokeWidth={2} />
                    <Text style={[
                      styles.roleTypeText,
                      newCustomer.role === 'customer' && styles.selectedRoleTypeText
                    ]}>
                      Customer
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.roleTypeButton,
                      newCustomer.role === 'receptionist' && styles.selectedRoleType
                    ]}
                    onPress={() => setNewCustomer(prev => ({ ...prev, role: 'receptionist' }))}
                    disabled={isSubmitting}
                  >
                    <UserCog size={16} color={newCustomer.role === 'receptionist' ? '#fff' : '#6B7280'} strokeWidth={2} />
                    <Text style={[
                      styles.roleTypeText,
                      newCustomer.role === 'receptionist' && styles.selectedRoleTypeText
                    ]}>
                      Receptionist
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {newCustomer.role === 'customer' && (
                <View style={styles.paymentTypeContainer}>
                  <Text style={styles.paymentTypeLabel}>Payment Type:</Text>
                  <View style={styles.paymentTypeButtons}>
                    <TouchableOpacity
                      style={[
                        styles.paymentTypeButton,
                        newCustomer.paymentType === 'cash' && styles.selectedPaymentType
                      ]}
                      onPress={() => setNewCustomer(prev => ({ ...prev, paymentType: 'cash' }))}
                      disabled={isSubmitting}
                    >
                      <CreditCard size={16} color={newCustomer.paymentType === 'cash' ? '#fff' : '#6B7280'} strokeWidth={2} />
                      <Text style={[
                        styles.paymentTypeText,
                        newCustomer.paymentType === 'cash' && styles.selectedPaymentTypeText
                      ]}>
                        Cash
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.paymentTypeButton,
                        newCustomer.paymentType === 'monthly' && styles.selectedPaymentType
                      ]}
                      onPress={() => setNewCustomer(prev => ({ ...prev, paymentType: 'monthly' }))}
                      disabled={isSubmitting}
                    >
                      <Receipt size={16} color={newCustomer.paymentType === 'monthly' ? '#fff' : '#6B7280'} strokeWidth={2} />
                      <Text style={[
                        styles.paymentTypeText,
                        newCustomer.paymentType === 'monthly' && styles.selectedPaymentTypeText
                      ]}>
                        Monthly
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.addCustomerButton, (isSubmitting || isUploadingPhoto) && styles.disabledButton]}
                onPress={handleAddCustomer}
                disabled={isSubmitting || isUploadingPhoto}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.addCustomerButtonText}>
                    Register {newCustomer.role === 'receptionist' ? 'Receptionist' : 'Customer'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Staff Orders Modal - Keep existing code */}
      {/* ... (existing staff orders modal code) ... */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  addButton: {
    backgroundColor: '#10B981',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  customerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerMainInfo: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  // 🆕 Profile photo styles
  profilePhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
  },
  profilePhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  customerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  receptionistBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  receptionistBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  customerEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  // 🆕 Phone number style
  customerPhone: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  customerNumber: {
    fontSize: 14,
    color: '#F97316',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  customerMeta: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  paymentType: {
    fontSize: 12,
    color: '#1F2937',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: 'bold',
  },
  firstLoginBadge: {
    fontSize: 12,
    color: '#F59E0B',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: 'bold',
  },
  customerStats: {
    gap: 6,
    alignItems: 'flex-end',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
  },
  balanceSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F97316',
  },
  billButton: {
    backgroundColor: '#F97316',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  billButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalForm: {
    maxHeight: 500,
    marginBottom: 24,
  },
  // 🆕 Photo upload styles
  photoUploadSection: {
    marginBottom: 16,
    alignItems: 'center',
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  photoUploadButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#10B981',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  photoUploadText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10B981',
  },
  photoPreviewContainer: {
    position: 'relative',
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 4,
  },
  changePhotoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  roleTypeContainer: {
    marginBottom: 16,
  },
  roleTypeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  roleTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  selectedRoleType: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  roleTypeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  selectedRoleTypeText: {
    color: '#fff',
  },
  paymentTypeContainer: {
    marginBottom: 16,
  },
  paymentTypeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  paymentTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  selectedPaymentType: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  paymentTypeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  selectedPaymentTypeText: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  addCustomerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
  },
  addCustomerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.6,
  },
});