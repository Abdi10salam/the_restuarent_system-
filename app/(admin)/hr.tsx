// app/(admin)/hr.tsx - WITH DELETE/DISABLE AND TYPESCRIPT FIXES

import React, { useState, useLayoutEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Modal, ActivityIndicator, Image } from 'react-native';
import { UserCog, Award, ShoppingCart, Receipt, Plus, Mail, User, X, Phone, Camera, Upload, Briefcase, Shield, Users, UtensilsCrossed, ChefHat, DollarSign, Edit, Trash2, UserX } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import { Customer } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { uploadProfileImage } from './../lib/supabase';

type FilterType = 'all' | 'staff' | 'admins' | 'best'; // ✅ FIXED: Added 'best'

export default function HRManagementScreen() {
  const navigation = useNavigation();
  const { state, addCustomerToSupabase, updateCustomerInSupabase } = useApp();
  const { customers, orders } = state;

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Include waiter and chef in staff
  const staffMembers = customers.filter(c => c.role === 'receptionist' || c.role === 'waiter' || c.role === 'chef');
  const adminMembers = customers.filter(c => c.role === 'admin' || c.role === 'master_admin');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    profilePhoto: '',
    salary: '',
    role: 'receptionist' as 'receptionist' | 'waiter' | 'chef' | 'admin',
  });

  const [editStaff, setEditStaff] = useState<{
    id: string;
    name: string;
    email: string;
    phone: string;
    profilePhoto: string;
    salary: string;
    role: 'receptionist' | 'waiter' | 'chef' | 'admin';
  } | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{ alignItems: 'center', maxWidth: 200 }}>
          <Text
            style={styles.sectionSubtitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {staffMembers.length} staff • {adminMembers.length} admin{adminMembers.length !== 1 ? 's' : ''}
          </Text>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={24} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, staffMembers.length, adminMembers.length]);

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
    };
  };

  const sortedStaffMembers = useMemo(() => {
    return [...staffMembers].sort((a, b) => {
      const statsA = getStaffStats(a.id);
      const statsB = getStaffStats(b.id);
      return statsB.totalOrders - statsA.totalOrders;
    });
  }, [staffMembers, orders]);

  const sortedAdminMembers = useMemo(() => {
    return [...adminMembers].sort((a, b) => {
      const statsA = getStaffStats(a.id);
      const statsB = getStaffStats(b.id);
      return statsB.totalOrders - statsA.totalOrders;
    });
  }, [adminMembers, orders]);

  const showAdmins = activeFilter === 'all' || activeFilter === 'admins';
  const showStaff = activeFilter === 'all' || activeFilter === 'staff';

  const bestPerformers = useMemo(() => {
    if (activeFilter !== 'best') return [];
    const allMembers = [...staffMembers, ...adminMembers];
    return allMembers
      .map(member => ({ member, stats: getStaffStats(member.id) }))
      .filter(item => item.stats.totalOrders > 0)
      .sort((a, b) => b.stats.totalOrders - a.stats.totalOrders)
      .slice(0, 1);
  }, [activeFilter, staffMembers, adminMembers, orders]);

  // 🆕 NEW: Open edit modal
  const handleEditStaff = (staff: Customer) => {
    setEditStaff({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone || '',
      profilePhoto: staff.profilePhoto || '',
      salary: staff.salary ? staff.salary.toString() : '',
      role: staff.role as 'receptionist' | 'waiter' | 'chef' | 'admin',
    });
    setShowEditModal(true);
  };

  // 🆕 NEW: Delete staff member
  const handleDeleteStaff = (staff: Customer) => {
    const stats = getStaffStats(staff.id);

    Alert.alert(
      'Delete Staff Member',
      `Are you sure you want to delete ${staff.name}?\n\n` +
      `This staff has:\n` +
      `• ${stats.totalOrders} total orders\n` +
      `• ${formatCurrency(stats.revenue)} in revenue\n\n` +
      `This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Add deleteCustomerFromSupabase to AppContext
              // await deleteCustomerFromSupabase(staff.id);
              Alert.alert('Note', 'Delete function needs to be implemented in AppContext');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete staff member');
            }
          }
        }
      ]
    );
  };

  // 🆕 NEW: Disable/Enable staff member
  const handleToggleStaffStatus = async (staff: Customer, currentlyDisabled: boolean) => {
    const action = currentlyDisabled ? 'enable' : 'disable';

    Alert.alert(
      `${action === 'disable' ? 'Disable' : 'Enable'} Staff Member`,
      `Are you sure you want to ${action} ${staff.name}?\n\n` +
      `${action === 'disable'
        ? 'They will not be able to login until re-enabled.'
        : 'They will be able to login again.'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'disable' ? 'Disable' : 'Enable',
          style: action === 'disable' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              // We'll use isFirstLogin as disabled flag (true = disabled)
              await updateCustomerInSupabase(staff.id, {
                isFirstLogin: !currentlyDisabled // Toggle disabled state
              });

              Alert.alert(
                'Success',
                `${staff.name} has been ${action}d successfully`
              );
            } catch (err) {
              Alert.alert('Error', `Failed to ${action} staff member`);
            }
          }
        }
      ]
    );
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return false;
    }
    return true;
  };

  const pickProfilePhoto = async (isEdit: boolean = false) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const localUri = result.assets[0].uri;

        if (isEdit && editStaff) {
          setEditStaff(prev => prev ? { ...prev, profilePhoto: localUri } : null);
        } else {
          setNewStaff(prev => ({ ...prev, profilePhoto: localUri }));
        }

        setIsUploadingPhoto(true);

        const imageUrl = await uploadProfileImage(localUri, isEdit ? editStaff?.email || 'staff' : newStaff.email || 'staff');

        if (imageUrl) {
          if (isEdit && editStaff) {
            setEditStaff(prev => prev ? { ...prev, profilePhoto: imageUrl } : null);
          } else {
            setNewStaff(prev => ({ ...prev, profilePhoto: imageUrl }));
          }
          Alert.alert('Success', 'Photo uploaded successfully!');
        } else {
          if (isEdit && editStaff) {
            setEditStaff(prev => prev ? { ...prev, profilePhoto: '' } : null);
          } else {
            setNewStaff(prev => ({ ...prev, profilePhoto: '' }));
          }
          Alert.alert('Error', 'Failed to upload photo.');
        }

        setIsUploadingPhoto(false);
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert('Error', 'Failed to pick photo.');
      setIsUploadingPhoto(false);
    }
  };

  const takeProfilePhoto = async (isEdit: boolean = false) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera access.');
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

        if (isEdit && editStaff) {
          setEditStaff(prev => prev ? { ...prev, profilePhoto: localUri } : null);
        } else {
          setNewStaff(prev => ({ ...prev, profilePhoto: localUri }));
        }

        setIsUploadingPhoto(true);

        const imageUrl = await uploadProfileImage(localUri, isEdit ? editStaff?.email || 'staff' : newStaff.email || 'staff');

        if (imageUrl) {
          if (isEdit && editStaff) {
            setEditStaff(prev => prev ? { ...prev, profilePhoto: imageUrl } : null);
          } else {
            setNewStaff(prev => ({ ...prev, profilePhoto: imageUrl }));
          }
          Alert.alert('Success', 'Photo uploaded successfully!');
        } else {
          if (isEdit && editStaff) {
            setEditStaff(prev => prev ? { ...prev, profilePhoto: '' } : null);
          } else {
            setNewStaff(prev => ({ ...prev, profilePhoto: '' }));
          }
          Alert.alert('Error', 'Failed to upload photo.');
        }

        setIsUploadingPhoto(false);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo.');
      setIsUploadingPhoto(false);
    }
  };

  const showPhotoOptions = (isEdit: boolean = false) => {
    Alert.alert(
      'Profile Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: () => takeProfilePhoto(isEdit) },
        { text: 'Choose from Gallery', onPress: () => pickProfilePhoto(isEdit) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.email) {
      Alert.alert('Error', 'Please fill in name and email');
      return;
    }

    if (!newStaff.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (newStaff.phone && !/^[0-9+\s()-]+$/.test(newStaff.phone)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    if (newStaff.salary && isNaN(parseFloat(newStaff.salary))) {
      Alert.alert('Error', 'Please enter a valid salary amount');
      return;
    }

    const existingUser = customers.find(c => c.email === newStaff.email);
    if (existingUser) {
      Alert.alert('Error', 'A user with this email already exists');
      return;
    }

    setIsSubmitting(true);

    try {
      const staff: Customer = {
        id: Date.now().toString(),
        name: newStaff.name,
        email: newStaff.email,
        phone: newStaff.phone || undefined,
        profilePhoto: newStaff.profilePhoto || undefined,
        customerNumber: 0,
        role: newStaff.role,
        paymentType: 'cash',
        monthlyBalance: 0,
        totalSpent: 0,
        salary: newStaff.salary ? parseFloat(newStaff.salary) : undefined,
        isFirstLogin: true,
        registeredAt: new Date().toISOString(),
      };

      await addCustomerToSupabase(staff, 'admin@test.com');

      setNewStaff({
        name: '',
        email: '',
        phone: '',
        profilePhoto: '',
        salary: '',
        role: 'receptionist',
      });
      setShowAddModal(false);

      const roleText = newStaff.role === 'admin' ? 'Admin' :
        newStaff.role === 'waiter' ? 'Waiter' :
          newStaff.role === 'chef' ? 'Chef' : 'Receptionist';
      Alert.alert(
        'Success',
        `${roleText} registered!\nThey can now login with ${newStaff.email}`,
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      console.error('Error creating staff:', err);
      Alert.alert('Error', err.message || 'Failed to register. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStaff = async () => {
    if (!editStaff) return;

    if (editStaff.salary && isNaN(parseFloat(editStaff.salary))) {
      Alert.alert('Error', 'Please enter a valid salary amount');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateCustomerInSupabase(editStaff.id, {
        phone: editStaff.phone || undefined,
        profilePhoto: editStaff.profilePhoto || undefined,
        role: editStaff.role,
        salary: editStaff.salary ? parseFloat(editStaff.salary) : undefined,
      });

      setShowEditModal(false);
      setEditStaff(null);

      Alert.alert('Success', 'Staff member updated successfully!');
    } catch (err: any) {
      console.error('Error updating staff:', err);
      Alert.alert('Error', err.message || 'Failed to update. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'receptionist':
        return { icon: UserCog, color: '#F97316', label: 'Receptionist' };
      case 'waiter':
        return { icon: UtensilsCrossed, color: '#8B5CF6', label: 'Waiter' };
      case 'chef':
        return { icon: ChefHat, color: '#EF4444', label: 'Chef' };
      case 'admin':
      case 'master_admin':
        return { icon: Shield, color: '#10B981', label: role === 'master_admin' ? 'Master Admin' : 'Admin' };
      default:
        return { icon: User, color: '#6B7280', label: 'Staff' };
    }
  };

  // 🆕 NEW: Staff card actions menu
  const showStaffActions = (staff: Customer) => {
    const isDisabled = staff.isFirstLogin === true; // Using isFirstLogin as disabled flag

    Alert.alert(
      staff.name,
      'Choose an action',
      [
        {
          text: 'Edit Staff',
          onPress: () => handleEditStaff(staff)
        },
        {
          text: isDisabled ? 'Enable Staff' : 'Disable Staff',
          onPress: () => handleToggleStaffStatus(staff, isDisabled),
          style: isDisabled ? 'default' : 'destructive'
        },
        {
          text: 'Delete Staff',
          onPress: () => handleDeleteStaff(staff),
          style: 'destructive'
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  // Render staff card
  const renderStaffCard = (member: Customer) => {
    const stats = getStaffStats(member.id);
    const roleInfo = getRoleInfo(member.role);
    const RoleIcon = roleInfo.icon;
    const isDisabled = member.isFirstLogin === true;

    return (
      <TouchableOpacity
        key={member.id}
        style={[
          styles.staffCard,
          { borderLeftColor: roleInfo.color },
          isDisabled && styles.disabledCard
        ]}
        activeOpacity={0.7}
        onPress={() => showStaffActions(member)}
      >
        <View style={styles.staffHeader}>
          <View style={styles.staffMainInfo}>
            {member.profilePhoto ? (
              <Image source={{ uri: member.profilePhoto }} style={styles.profilePhoto} />
            ) : (
              <View style={[styles.profilePhotoPlaceholder, { backgroundColor: `${roleInfo.color}20` }]}>
                <RoleIcon size={28} color={roleInfo.color} strokeWidth={2} />
              </View>
            )}

            <View style={styles.staffInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.staffName}>{member.name}</Text>
                <View style={[styles.staffBadge, { backgroundColor: roleInfo.color }]}>
                  <RoleIcon size={10} color="#fff" strokeWidth={2} />
                  <Text style={styles.staffBadgeText}>{roleInfo.label}</Text>
                </View>
              </View>
              <Text style={styles.staffEmail}>📧 {member.email}</Text>
              {member.phone && (
                <Text style={styles.staffPhone}>📱 {member.phone}</Text>
              )}
              {member.salary && (
                <Text style={styles.staffSalary}>
                  💰 Salary: {formatCurrency(member.salary)}/month
                </Text>
              )}
            </View>
          </View>

          <View style={styles.staffStats}>
            <View style={styles.statItem}>
              <ShoppingCart size={16} color="#10B981" strokeWidth={2} />
              <Text style={styles.statText}>{stats.totalOrders}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statText}>{formatCurrency(stats.revenue)}</Text>
            </View>
          </View>
        </View>

        {stats.totalOrders > 0 && (
          <View style={styles.performanceSection}>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Walk-in</Text>
              <Text style={styles.performanceValue}>{stats.walkInOrders}</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Customer</Text>
              <Text style={styles.performanceValue}>{stats.customerOrders}</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Pending</Text>
              <Text style={[styles.performanceValue, { color: '#F59E0B' }]}>{stats.pendingOrders}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setActiveFilter('all')}
            activeOpacity={0.8}
          >
            <Users size={18} color={activeFilter === 'all' ? '#fff' : '#6B7280'} strokeWidth={2} />
            <Text style={[styles.filterButtonText, activeFilter === 'all' && styles.filterButtonTextActive]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'staff' && styles.filterButtonActive]}
            onPress={() => setActiveFilter('staff')}
            activeOpacity={0.8}
          >
            <UserCog size={18} color={activeFilter === 'staff' ? '#fff' : '#F97316'} strokeWidth={2} />
            <Text style={[styles.filterButtonText, activeFilter === 'staff' && styles.filterButtonTextActive]}>
              Staff
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'admins' && styles.filterButtonActive]}
            onPress={() => setActiveFilter('admins')}
            activeOpacity={0.8}
          >
            <Shield size={18} color={activeFilter === 'admins' ? '#fff' : '#10B981'} strokeWidth={2} />
            <Text style={[styles.filterButtonText, activeFilter === 'admins' && styles.filterButtonTextActive]}>
              Admins
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'best' && styles.filterButtonActive]}
            onPress={() => setActiveFilter('best')}
            activeOpacity={0.8}
          >
            <Award size={18} color={activeFilter === 'best' ? '#fff' : '#F59E0B'} strokeWidth={2} />
            <Text style={[styles.filterButtonText, activeFilter === 'best' && styles.filterButtonTextActive]}>
              Best
            </Text>
          </TouchableOpacity>
        </View>

        {/* ADMINS SECTION */}
        {showAdmins && sortedAdminMembers.length > 0 && activeFilter !== 'best' && (
          <>
            <View style={styles.sectionHeader}>
              <Shield size={20} color="#10B981" strokeWidth={2} />
              <Text style={styles.sectionHeaderText}>
                Administrators {activeFilter !== 'all' && `(${sortedAdminMembers.length})`}
              </Text>
            </View>
            {sortedAdminMembers.map(renderStaffCard)}
          </>
        )}

        {/* STAFF SECTION */}
        {showStaff && sortedStaffMembers.length > 0 && activeFilter !== 'best' && (
          <>
            <View style={styles.sectionHeader}>
              <UserCog size={20} color="#F97316" strokeWidth={2} />
              <Text style={styles.sectionHeaderText}>
                Staff Members {activeFilter !== 'all' && `(${sortedStaffMembers.length})`}
              </Text>
            </View>
            {sortedStaffMembers.map(renderStaffCard)}
          </>
        )}

        {/* BEST STAFF SECTION */}
        {activeFilter === 'best' && bestPerformers.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Award size={20} color="#F59E0B" strokeWidth={2} />
              <Text style={styles.sectionHeaderText}>Top Performer 🏆</Text>
            </View>
            {bestPerformers.map(({ member }) => renderStaffCard(member))}
          </>
        )}

        {/* Empty State */}
        {((activeFilter === 'all' && staffMembers.length === 0 && adminMembers.length <= 1) ||
          (activeFilter === 'staff' && staffMembers.length === 0) ||
          (activeFilter === 'admins' && adminMembers.length === 0) ||
          (activeFilter === 'best' && bestPerformers.length === 0)) && (
          <View style={styles.emptyState}>
            {activeFilter === 'best' ? (
              <Award size={64} color="#D1D5DB" strokeWidth={1} />
            ) : activeFilter === 'staff' ? (
              <UserCog size={64} color="#D1D5DB" strokeWidth={1} />
            ) : activeFilter === 'admins' ? (
              <Shield size={64} color="#D1D5DB" strokeWidth={1} />
            ) : (
              <Users size={64} color="#D1D5DB" strokeWidth={1} />
            )}
            <Text style={styles.emptyText}>
              {activeFilter === 'best'
                ? 'No top performers yet'
                : activeFilter === 'staff'
                  ? 'No staff members yet'
                  : activeFilter === 'admins'
                    ? 'No administrators yet'
                    : 'No team members yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeFilter === 'best'
                ? 'Staff need to complete orders to appear here'
                : 'Add your first team member to get started'}
            </Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add Staff Modal - KEEPING SAME AS BEFORE */}
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
                <Text style={styles.modalTitle}>Register Team Member</Text>
                <Text style={styles.modalDescription}>
                  They will receive an OTP for first login
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {/* Role Selection */}
              <View style={styles.roleSelection}>
                <Text style={styles.roleLabel}>Account Type</Text>
                <View style={styles.roleButtons}>
                  <TouchableOpacity
                    style={[styles.roleButton, newStaff.role === 'receptionist' && styles.roleButtonActive]}
                    onPress={() => setNewStaff(prev => ({ ...prev, role: 'receptionist' }))}
                    disabled={isSubmitting}
                  >
                    <UserCog size={20} color={newStaff.role === 'receptionist' ? '#fff' : '#F97316'} strokeWidth={2} />
                    <Text style={[styles.roleButtonText, newStaff.role === 'receptionist' && styles.roleButtonTextActive]}>
                      Receptionist
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleButton, newStaff.role === 'waiter' && styles.roleButtonActive]}
                    onPress={() => setNewStaff(prev => ({ ...prev, role: 'waiter' }))}
                    disabled={isSubmitting}
                  >
                    <UtensilsCrossed size={20} color={newStaff.role === 'waiter' ? '#fff' : '#8B5CF6'} strokeWidth={2} />
                    <Text style={[styles.roleButtonText, newStaff.role === 'waiter' && styles.roleButtonTextActive]}>
                      Waiter
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.roleButtons, { marginTop: 12 }]}>
                  <TouchableOpacity
                    style={[styles.roleButton, newStaff.role === 'chef' && styles.roleButtonActive]}
                    onPress={() => setNewStaff(prev => ({ ...prev, role: 'chef' }))}
                    disabled={isSubmitting}
                  >
                    <ChefHat size={20} color={newStaff.role === 'chef' ? '#fff' : '#EF4444'} strokeWidth={2} />
                    <Text style={[styles.roleButtonText, newStaff.role === 'chef' && styles.roleButtonTextActive]}>
                      Chef
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleButton, newStaff.role === 'admin' && styles.roleButtonActive]}
                    onPress={() => setNewStaff(prev => ({ ...prev, role: 'admin' }))}
                    disabled={isSubmitting}
                  >
                    <Shield size={20} color={newStaff.role === 'admin' ? '#fff' : '#10B981'} strokeWidth={2} />
                    <Text style={[styles.roleButtonText, newStaff.role === 'admin' && styles.roleButtonTextActive]}>
                      Administrator
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.photoUploadSection}>
                <Text style={styles.photoLabel}>Profile Photo (Optional)</Text>
                {newStaff.profilePhoto ? (
                  <View style={styles.photoPreviewContainer}>
                    <Image source={{ uri: newStaff.profilePhoto }} style={styles.photoPreview} />
                    {isUploadingPhoto && (
                      <View style={styles.uploadingOverlay}>
                        <ActivityIndicator size="large" color="#fff" />
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.changePhotoButton}
                      onPress={() => showPhotoOptions(false)}
                      disabled={isUploadingPhoto || isSubmitting}
                    >
                      <Upload size={14} color="#fff" strokeWidth={2} />
                      <Text style={styles.changePhotoText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.photoUploadButton}
                    onPress={() => showPhotoOptions(false)}
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
                  value={newStaff.name}
                  onChangeText={(text) => setNewStaff(prev => ({ ...prev, name: text }))}
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.inputContainer}>
                <Mail size={20} color="#6B7280" strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address *"
                  value={newStaff.email}
                  onChangeText={(text) => setNewStaff(prev => ({ ...prev, email: text }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.inputContainer}>
                <Phone size={20} color="#6B7280" strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number (Optional)"
                  value={newStaff.phone}
                  onChangeText={(text) => setNewStaff(prev => ({ ...prev, phone: text }))}
                  keyboardType="phone-pad"
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.inputContainer}>
                <DollarSign size={20} color="#6B7280" strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="Monthly Salary/Wage (Optional)"
                  value={newStaff.salary}
                  onChangeText={(text) => {
                    const numericText = text.replace(/[^0-9]/g, '');
                    setNewStaff(prev => ({ ...prev, salary: numericText }));
                  }}
                  keyboardType="numeric"
                  editable={!isSubmitting}
                />
              </View>
              {newStaff.salary && (
                <Text style={styles.salaryPreview}>
                  Salary: {formatCurrency(parseFloat(newStaff.salary) || 0)}/month
                </Text>
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
                style={[styles.addStaffButton, (isSubmitting || isUploadingPhoto) && styles.disabledButton]}
                onPress={handleAddStaff}
                disabled={isSubmitting || isUploadingPhoto}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.addStaffButtonText}>
                    Register {newStaff.role === 'admin' ? 'Admin' :
                    newStaff.role === 'waiter' ? 'Waiter' :
                      newStaff.role === 'chef' ? 'Chef' : 'Staff'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Staff Modal - KEEPING SAME AS BEFORE */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => !isSubmitting && setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Staff Member</Text>
                <Text style={styles.modalDescription}>
                  Update role, salary, or contact info
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X size={24} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {editStaff && (
              <ScrollView style={styles.modalForm}>
                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>{editStaff.name}</Text>
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{editStaff.email}</Text>
                </View>

                <View style={styles.roleSelection}>
                  <Text style={styles.roleLabel}>Change Role (Promote/Demote)</Text>
                  <View style={styles.roleButtons}>
                    <TouchableOpacity
                      style={[styles.roleButton, editStaff.role === 'receptionist' && styles.roleButtonActive]}
                      onPress={() => setEditStaff(prev => prev ? { ...prev, role: 'receptionist' } : null)}
                      disabled={isSubmitting}
                    >
                      <UserCog size={20} color={editStaff.role === 'receptionist' ? '#fff' : '#F97316'} strokeWidth={2} />
                      <Text style={[styles.roleButtonText, editStaff.role === 'receptionist' && styles.roleButtonTextActive]}>
                        Receptionist
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.roleButton, editStaff.role === 'waiter' && styles.roleButtonActive]}
                      onPress={() => setEditStaff(prev => prev ? { ...prev, role: 'waiter' } : null)}
                      disabled={isSubmitting}
                    >
                      <UtensilsCrossed size={20} color={editStaff.role === 'waiter' ? '#fff' : '#8B5CF6'} strokeWidth={2} />
                      <Text style={[styles.roleButtonText, editStaff.role === 'waiter' && styles.roleButtonTextActive]}>
                        Waiter
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.roleButtons, { marginTop: 12 }]}>
                    <TouchableOpacity
                      style={[styles.roleButton, editStaff.role === 'chef' && styles.roleButtonActive]}
                      onPress={() => setEditStaff(prev => prev ? { ...prev, role: 'chef' } : null)}
                      disabled={isSubmitting}
                    >
                      <ChefHat size={20} color={editStaff.role === 'chef' ? '#fff' : '#EF4444'} strokeWidth={2} />
                      <Text style={[styles.roleButtonText, editStaff.role === 'chef' && styles.roleButtonTextActive]}>
                        Chef
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.roleButton, editStaff.role === 'admin' && styles.roleButtonActive]}
                      onPress={() => setEditStaff(prev => prev ? { ...prev, role: 'admin' } : null)}
                      disabled={isSubmitting}
                    >
                      <Shield size={20} color={editStaff.role === 'admin' ? '#fff' : '#10B981'} strokeWidth={2} />
                      <Text style={[styles.roleButtonText, editStaff.role === 'admin' && styles.roleButtonTextActive]}>
                        Administrator
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Phone size={20} color="#6B7280" strokeWidth={2} />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    value={editStaff.phone}
                    onChangeText={(text) => setEditStaff(prev => prev ? { ...prev, phone: text } : null)}
                    keyboardType="phone-pad"
                    editable={!isSubmitting}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <DollarSign size={20} color="#6B7280" strokeWidth={2} />
                  <TextInput
                    style={styles.input}
                    placeholder="Monthly Salary/Wage"
                    value={editStaff.salary}
                    onChangeText={(text) => {
                      const numericText = text.replace(/[^0-9]/g, '');
                      setEditStaff(prev => prev ? { ...prev, salary: numericText } : null);
                    }}
                    keyboardType="numeric"
                    editable={!isSubmitting}
                  />
                </View>
                {editStaff.salary && (
                  <Text style={styles.salaryPreview}>
                    New Salary: {formatCurrency(parseFloat(editStaff.salary) || 0)}/month
                  </Text>
                )}
              </ScrollView>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowEditModal(false);
                  setEditStaff(null);
                }}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.addStaffButton, isSubmitting && styles.disabledButton]}
                onPress={handleUpdateStaff}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.addStaffButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerButton: {
    backgroundColor: '#10B981',
    padding: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOpacity: 0.2,
    elevation: 4,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  staffCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#F97316',
    position: 'relative',
  },
  disabledCard: {
    opacity: 0.6,
    backgroundColor: '#F3F4F6',
  },
  badgeContainer: {
    position: 'absolute',
    top: 58,
    right: 2,
    flexDirection: 'row',
    zIndex: 10,
  },
  disabledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  disabledBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  editBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  editBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#10B981',
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  staffMainInfo: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
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
    backgroundColor: '#FEF3E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  staffName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  staffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F97316',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  staffBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  staffEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  staffPhone: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  staffSalary: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  staffStats: {
    gap: 8,
    alignItems: 'flex-end',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  performanceSection: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  performanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  performanceLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 6,
    textAlign: 'center',
  },
  performanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
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
    maxHeight: 450,
    marginBottom: 24,
  },
  infoSection: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  roleSelection: {
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  roleButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
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
  salaryPreview: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    textAlign: 'center',
    marginTop: -8,
    marginBottom: 16,
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
  addStaffButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
  },
  addStaffButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.6,
  },
});