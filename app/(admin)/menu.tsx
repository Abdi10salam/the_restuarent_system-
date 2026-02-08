// app/(admin)/menu-management.tsx 
import React, { useState, useMemo,useLayoutEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Modal, Image, ActivityIndicator } from 'react-native';
import { Plus, Edit, Trash2, Save, X, Upload, Camera, Package } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { CategoryFilter } from '../../components/CategoryFilter';
import { useApp } from '../../context/AppContext';
import { uploadDishImage, deleteDishImage } from './../lib/supabase';
import { Dish } from '../../types';
import { formatCurrency, parseCurrencyInput } from '../../utils/currency';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';


export default function AdminMenuScreen() {
  const { state, addDishToSupabase, updateDishInSupabase, deleteDishFromSupabase } = useApp();
  const { dishes, isLoading } = state;
  
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
    const navigation = useNavigation();
  const [dishForm, setDishForm] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    category: 'Lunch',
    available: true,
    stockQuantity: '', // 🆕 NEW: Stock quantity
    hasStock: false,   // 🆕 NEW: Enable/disable stock tracking
  });
  useLayoutEffect(() => {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={24} color="#ffff" strokeWidth={2} />
          </TouchableOpacity>
        ),
      });
    }, [navigation]);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(dishes.map((dish) => dish.category))];
    return uniqueCategories.sort();
  }, [dishes]);

  const filteredDishes = useMemo(() => {
    if (selectedCategory === "All") return dishes;
    return dishes.filter((dish) => dish.category === selectedCategory);
  }, [selectedCategory, dishes]);

  const resetForm = () => {
    setDishForm({
      name: '',
      description: '',
      price: '',
      image: '',
      category: 'Lunch',
      available: true,
      stockQuantity: '',
      hasStock: false,
    });
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const localUri = result.assets[0].uri;
        setDishForm(prev => ({ ...prev, image: localUri }));
        setIsUploadingImage(true);
        
        const imageUrl = await uploadDishImage(localUri, dishForm.name || 'dish');

        if (imageUrl) {
          setDishForm(prev => ({ ...prev, image: imageUrl }));
          Alert.alert('Success', 'Image uploaded!');
        } else {
          setDishForm(prev => ({ ...prev, image: '' }));
          Alert.alert('Error', 'Failed to upload image.');
        }
        
        setIsUploadingImage(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image.');
      setIsUploadingImage(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera access.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const localUri = result.assets[0].uri;
        setDishForm(prev => ({ ...prev, image: localUri }));
        setIsUploadingImage(true);
        
        const imageUrl = await uploadDishImage(localUri, dishForm.name || 'dish');

        if (imageUrl) {
          setDishForm(prev => ({ ...prev, image: imageUrl }));
          Alert.alert('Success', 'Photo uploaded!');
        } else {
          setDishForm(prev => ({ ...prev, image: '' }));
          Alert.alert('Error', 'Failed to upload photo.');
        }
        
        setIsUploadingImage(false);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo.');
      setIsUploadingImage(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Dish Image',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleAddDish = async () => {
    if (!dishForm.name || !dishForm.description || !dishForm.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const price = parseCurrencyInput(dishForm.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    // 🆕 Validate stock quantity
    let stockQuantity: number | null = null;
    if (dishForm.hasStock) {
      const stock = parseInt(dishForm.stockQuantity);
      if (isNaN(stock) || stock < 0) {
        Alert.alert('Error', 'Please enter a valid stock quantity (0 or more)');
        return;
      }
      stockQuantity = stock;
    }

    setIsSubmitting(true);

    try {
      const newDish: Dish = {
        id: Date.now().toString(),
        name: dishForm.name,
        description: dishForm.description,
        price: price,
        image: dishForm.image || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
        category: dishForm.category,
        available: dishForm.available,
        stockQuantity: stockQuantity, // 🆕 NEW
      };

      await addDishToSupabase(newDish, 'admin@test.com');
      
      resetForm();
      setShowAddModal(false);
      Alert.alert('Success', 'Dish added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add dish.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDish = (dish: Dish) => {
    setEditingDish(dish);
    setDishForm({
      name: dish.name,
      description: dish.description,
      price: dish.price.toString(),
      image: dish.image,
      category: dish.category,
      available: dish.available,
      stockQuantity: dish.stockQuantity !== null && dish.stockQuantity !== undefined ? dish.stockQuantity.toString() : '',
      hasStock: dish.stockQuantity !== null && dish.stockQuantity !== undefined,
    });
    setShowAddModal(true);
  };

  const handleUpdateDish = async () => {
    if (!editingDish || !dishForm.name || !dishForm.description || !dishForm.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const price = parseCurrencyInput(dishForm.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    // 🆕 Validate stock quantity
    let stockQuantity: number | null = null;
    if (dishForm.hasStock) {
      const stock = parseInt(dishForm.stockQuantity);
      if (isNaN(stock) || stock < 0) {
        Alert.alert('Error', 'Please enter a valid stock quantity');
        return;
      }
      stockQuantity = stock;
    }

    setIsSubmitting(true);

    try {
      const updates: Partial<Dish> = {
        name: dishForm.name,
        description: dishForm.description,
        price: price,
        image: dishForm.image,
        category: dishForm.category,
        available: dishForm.available,
        stockQuantity: stockQuantity, // 🆕 NEW
      };

      await updateDishInSupabase(editingDish.id, updates);
      
      resetForm();
      setEditingDish(null);
      setShowAddModal(false);
      Alert.alert('Success', 'Dish updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update dish.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDish = (dish: Dish) => {
    Alert.alert(
      'Delete Dish',
      'Are you sure you want to delete this dish?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (dish.image.includes('supabase')) {
                await deleteDishImage(dish.image);
              }
              await deleteDishFromSupabase(dish.id);
              Alert.alert('Success', 'Dish deleted!');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete dish.');
            }
          },
        },
      ]
    );
  };

  const toggleAvailability = async (dishId: string, available: boolean) => {
    try {
      await updateDishInSupabase(dishId, { available });
    } catch (error) {
      Alert.alert('Error', 'Failed to update availability.');
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingDish(null);
    resetForm();
  };

  return (
    <View style={styles.container}>
      <View>
        <View>
        </View> 
      </View>
      {/* 🆕 NEW: Category Filter */}
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        iconMap={{
          All: require('../../assets/images/all.png'),
          Breakfast: require('../../assets/images/coffee-cup.png'),
          Lunch: require('../../assets/images/lunch.png'),
          Dinner: require('../../assets/images/dinner.png'),
          Supper: require('../../assets/images/supper.png'),
          Juices: require('../../assets/images/juices.png'),
        }}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B5D4F" />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.dishesGrid}>
          {filteredDishes.map((dish) => {
            // 🆕 Check stock status
            const isOutOfStock = dish.stockQuantity !== null && dish.stockQuantity !== undefined && dish.stockQuantity === 0;
            const isLowStock = dish.stockQuantity !== null && dish.stockQuantity !== undefined && dish.stockQuantity > 0 && dish.stockQuantity <= 5;

            return (
              <View key={dish.id} style={styles.dishCard}>
                <View style={styles.dishImageContainer}>
                  <Image source={{ uri: dish.image }} style={styles.dishImage} resizeMode="cover" />
                
                {/* 🆕 Stock Badge */}
                {dish.stockQuantity !== null && dish.stockQuantity !== undefined && (
                  <View style={[
                    styles.stockBadge,
                    isOutOfStock && styles.outOfStockBadge,
                    isLowStock && styles.lowStockBadge
                  ]}>
                    <Package size={12} color="#fff" strokeWidth={2} />
                    <Text style={styles.stockBadgeText}>
                      {isOutOfStock ? 'Out of Stock' : `${dish.stockQuantity} left`}
                    </Text>
                  </View>
                )}
                </View>
                <View style={styles.dishContent}>
                  <Text style={styles.dishName} numberOfLines={1}>{dish.name}</Text>
                  <Text style={styles.dishCategory}>{dish.category}</Text>
                  <Text style={styles.dishPrice}>{formatCurrency(dish.price)}</Text>
                  
                  <Text style={styles.dishDescription} numberOfLines={2}>{dish.description}</Text>
                  
                  <View style={styles.dishActions}>
                    <TouchableOpacity
                        style={[
                          styles.availabilityButton,
                          { backgroundColor: dish.available ? '#E6F1EC' : '#FDE8E8' }
                        ]}
                        onPress={() => toggleAvailability(dish.id, !dish.available)}
                      >
                      <Text style={[
                        styles.availabilityText,
                        { color: dish.available ? '#3B5D4F' : '#EF4444' }
                      ]}>
                        {dish.available ? 'Available' : 'Unavailable'}
                      </Text>
                    </TouchableOpacity>
                    
                    <View style={styles.actionButtons}>
                      <TouchableOpacity style={styles.editButton} onPress={() => handleEditDish(dish)}>
                        <Edit size={16} color="#F97316" strokeWidth={2} />
                      </TouchableOpacity>
                      
                      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteDish(dish)}>
                        <Trash2 size={16} color="#EF4444" strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
          </View>

          {filteredDishes.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No dishes in {selectedCategory}</Text>
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      )}

      {/* Add/Edit Dish Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#eddcdc', '#2F4A3F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>{editingDish ? 'Edit Dish' : 'Add New Dish'}</Text>
              <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}>
                <X size={22} color="#fff" strokeWidth={2} />
              </TouchableOpacity>
            </LinearGradient>
            
            <ScrollView style={styles.modalForm}>
              {dishForm.image ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: dishForm.image }} style={styles.imagePreview} resizeMode="cover" />
                  {isUploadingImage && (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator size="large" color="#fff" />
                    </View>
                  )}
                  <TouchableOpacity style={styles.changeImageButton} onPress={showImageOptions} disabled={isUploadingImage}>
                    <Upload size={16} color="#fff" strokeWidth={2} />
                    <Text style={styles.changeImageText}>Change Image</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadButton} onPress={showImageOptions} disabled={isUploadingImage || isSubmitting}>
                  {isUploadingImage ? (
                    <ActivityIndicator color="#3B5D4F" size="large" />
                  ) : (
                    <>
                      <Camera size={32} color="#3B5D4F" strokeWidth={2} />
                      <Text style={styles.uploadButtonText}>Add Dish Image</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <TextInput
                style={styles.textInput}
                placeholder="Dish Name *"
                value={dishForm.name}
                onChangeText={(text) => setDishForm(prev => ({ ...prev, name: text }))}
                editable={!isSubmitting}
              />

              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Description *"
                value={dishForm.description}
                onChangeText={(text) => setDishForm(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={3}
                editable={!isSubmitting}
              />

              <TextInput
                style={styles.textInput}
                placeholder="Price in UGX *"
                value={dishForm.price}
                onChangeText={(text) => setDishForm(prev => ({ ...prev, price: text }))}
                keyboardType="numeric"
                editable={!isSubmitting}
              />

              <View style={styles.categoryContainer}>
                <Text style={styles.categoryLabel}>Category:</Text>
                <View style={styles.categoryButtons}>
                  {['Breakfast', 'Lunch', 'Dinner', 'Supper', 'Juices'].map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[styles.categoryButton, dishForm.category === category && styles.selectedCategory]}
                      onPress={() => setDishForm(prev => ({ ...prev, category }))}
                      disabled={isSubmitting}
                    >
                      <Text style={[styles.categoryButtonText, dishForm.category === category && styles.selectedCategoryText]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 🆕 NEW: Stock Management */}
              <View style={styles.stockContainer}>
                <View style={styles.stockHeader}>
                  <Package size={20} color="#10B981" strokeWidth={2} />
                  <Text style={styles.stockLabel}>Stock Management</Text>
                </View>
                
                <TouchableOpacity
                  style={styles.stockToggle}
                  onPress={() => setDishForm(prev => ({ ...prev, hasStock: !prev.hasStock }))}
                  disabled={isSubmitting}
                >
                  <View style={[styles.checkbox, dishForm.hasStock && styles.checkboxActive]}>
                    {dishForm.hasStock && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.stockToggleText}>
                    Enable stock tracking for this dish
                  </Text>
                </TouchableOpacity>

                {dishForm.hasStock && (
                  <View style={styles.stockInputContainer}>
                    <TextInput
                      style={styles.stockInput}
                      placeholder="Enter stock quantity (e.g., 10)"
                      value={dishForm.stockQuantity}
                      onChangeText={(text) => setDishForm(prev => ({ ...prev, stockQuantity: text }))}
                      keyboardType="numeric"
                      editable={!isSubmitting}
                    />
                    <Text style={styles.stockHelper}>
                      💡 Stock will decrease as orders are placed and dish becomes unavailable at 0
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.availabilityContainer}>
                <Text style={styles.availabilityLabel}>Availability:</Text>
                <View style={styles.availabilityButtons}>
                  <TouchableOpacity
                    style={[styles.availabilityToggle, dishForm.available && styles.selectedAvailability]}
                    onPress={() => setDishForm(prev => ({ ...prev, available: true }))}
                    disabled={isSubmitting}
                  >
                    <Text style={[styles.availabilityToggleText, dishForm.available && styles.selectedAvailabilityText]}>
                      Available
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.availabilityToggle, !dishForm.available && styles.selectedUnavailability]}
                    onPress={() => setDishForm(prev => ({ ...prev, available: false }))}
                    disabled={isSubmitting}
                  >
                    <Text style={[styles.availabilityToggleText, !dishForm.available && styles.selectedUnavailabilityText]}>
                      Unavailable
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeModal} disabled={isSubmitting}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.saveButton, isSubmitting && styles.disabledButton]}
                onPress={editingDish ? handleUpdateDish : handleAddDish}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Save size={16} color="#fff" strokeWidth={2} />
                    <Text style={styles.saveButtonText}>{editingDish ? 'Update' : 'Add'} Dish</Text>
                  </>
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
  headerButton: {
    backgroundColor: '#3B5D4F',
    padding: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  container: { flex: 1, backgroundColor: '#F7F3EE' },
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
  title: { fontSize: 32, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#6B7280' },
  addButton: {
    backgroundColor: '#3B5D4F',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 12, paddingBottom: 60 },
  dishesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    gap: 12,
  },
  dishCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  dishImageContainer: {
    width: '100%',
    aspectRatio: 1.2,
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  dishImage: { width: '100%', height: '100%' },
  stockBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  outOfStockBadge: { backgroundColor: '#EF4444' },
  lowStockBadge: { backgroundColor: '#F59E0B' },
  stockBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  dishContent: { padding: 12 },
  dishName: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 2 },
  dishCategory: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  dishPrice: { fontSize: 18, fontWeight: '700', color: '#D97706', marginBottom: 8 },
  dishDescription: { fontSize: 12, color: '#6B7280', marginBottom: 12, lineHeight: 16 },
  dishActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  availabilityText: { fontSize: 11, fontWeight: 'bold' },
  actionButtons: { flexDirection: 'row', gap: 8 },
  editButton: { backgroundColor: '#FEF3E2', borderRadius: 10, padding: 8 },
  deleteButton: { backgroundColor: '#FEE2E2', borderRadius: 10, padding: 8 },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  bottomPadding: { height: 60 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#F7F3EE',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalForm: { maxHeight: 500, marginBottom: 24 },
  uploadButton: {
    backgroundColor: '#F7F3EE',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B5D4F',
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadButtonText: { fontSize: 16, fontWeight: 'bold', color: '#3B5D4F', marginTop: 12 },
  imagePreviewContainer: { marginBottom: 16, position: 'relative' },
  imagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeImageButton: {
    backgroundColor: '#3B5D4F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  changeImageText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  textInput: {
    backgroundColor: '#F7F3EE',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 16,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  categoryContainer: { marginBottom: 16 },
  categoryLabel: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  categoryButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedCategory: { backgroundColor: '#3B5D4F', borderColor: '#3B5D4F' },
  categoryButtonText: { fontSize: 14, fontWeight: 'bold', color: '#6B7280' },
  selectedCategoryText: { color: '#fff' },
  
  // 🆕 NEW: Stock Management Styles
  stockContainer: {
    backgroundColor: '#F3EFE9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D9D2C7',
  },
  stockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  stockLabel: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  stockToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#3B5D4F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: { backgroundColor: '#3B5D4F' },
  checkmark: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  stockToggleText: { fontSize: 14, color: '#1F2937', flex: 1 },
  stockInputContainer: { marginTop: 8 },
  stockInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#3B5D4F',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 8,
  },
  stockHelper: {
    fontSize: 12,
    color: '#3B5D4F',
    lineHeight: 18,
  },
  
  availabilityContainer: { marginBottom: 16 },
  availabilityLabel: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  availabilityButtons: { flexDirection: 'row', gap: 8 },
  availabilityToggle: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  selectedAvailability: { backgroundColor: '#3B5D4F', borderColor: '#3B5D4F' },
  selectedUnavailability: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  availabilityToggleText: { fontSize: 14, fontWeight: 'bold', color: '#6B7280' },
  selectedAvailabilityText: { color: '#fff' },
  selectedUnavailabilityText: { color: '#fff' },
  
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: { fontSize: 16, fontWeight: 'bold', color: '#6B7280' },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B5D4F',
    gap: 6,
  },
  saveButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  disabledButton: { opacity: 0.6 },
});
