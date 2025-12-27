import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Modal, Image, ActivityIndicator } from 'react-native';
import { Plus, CreditCard as Edit, Trash2, Save, X, Upload, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../../context/AppContext';
import { uploadDishImage, deleteDishImage } from './../lib/supabase';
import { Dish } from '../../types';
import { formatCurrency, parseCurrencyInput } from '../../utils/currency';

export default function AdminMenuScreen() {
  const { state, addDishToSupabase, updateDishInSupabase, deleteDishFromSupabase, fetchDishesFromSupabase } = useApp();
  const { dishes, isLoading } = state;
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [dishForm, setDishForm] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    category: 'Lunch',
    available: true
  });

  const categories = ['Breakfast', 'Lunch', 'Dinner', 'Supper', 'Juices'];

  const resetForm = () => {
    setDishForm({
      name: '',
      description: '',
      price: '',
      image: '',
      category: 'Lunch',
      available: true
    });
  };

  // Request camera permissions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload images.');
      return false;
    }
    return true;
  };

  // Pick image from gallery
const pickImage = async () => {
  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      const localUri = result.assets[0].uri;
      
      console.log('Picked image:', localUri);
      console.log('Image width:', result.assets[0].width);
      console.log('Image height:', result.assets[0].height);
      
      // Show local image immediately
      setDishForm(prev => ({ ...prev, image: localUri }));
      setIsUploadingImage(true);
      
      // Upload to Supabase
      const imageUrl = await uploadDishImage(localUri, dishForm.name || 'dish');

      if (imageUrl) {
        setDishForm(prev => ({ ...prev, image: imageUrl }));
        Alert.alert('Success', 'Image uploaded successfully!');
      } else {
        setDishForm(prev => ({ ...prev, image: '' }));
        Alert.alert('Error', 'Failed to upload image. Please try again.');
      }
      
      setIsUploadingImage(false);
    }
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Error', 'Failed to pick image.');
    setIsUploadingImage(false);
  }
};

  // Take photo with camera
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your camera to take photos.');
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
        
        // Show local image immediately for preview
        setDishForm(prev => ({ ...prev, image: localUri }));
        setIsUploadingImage(true);
        
        const imageUrl = await uploadDishImage(
          localUri,
          dishForm.name || 'dish'
        );

        if (imageUrl) {
          // Replace local URI with Supabase URL
          setDishForm(prev => ({ ...prev, image: imageUrl }));
          Alert.alert('Success', 'Photo uploaded successfully!');
        } else {
          // Revert to empty if upload fails
          setDishForm(prev => ({ ...prev, image: '' }));
          Alert.alert('Error', 'Failed to upload photo. Please try again.');
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
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Gallery',
          onPress: pickImage,
        },
        {
          text: 'Enter URL',
          onPress: () => {
            Alert.prompt(
              'Image URL',
              'Enter the image URL',
              (url) => {
                if (url) {
                  setDishForm(prev => ({ ...prev, image: url }));
                }
              }
            );
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
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

    setIsSubmitting(true);

    try {
      const newDish: Dish = {
        id: Date.now().toString(),
        name: dishForm.name,
        description: dishForm.description,
        price: price,
        image: dishForm.image || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=300',
        category: dishForm.category,
        available: dishForm.available,
      };

      await addDishToSupabase(newDish, 'admin@test.com');
      
      resetForm();
      setShowAddModal(false);
      Alert.alert('Success', 'Dish added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add dish. Please try again.');
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
      available: dish.available
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

    setIsSubmitting(true);

    try {
      const updates: Partial<Dish> = {
        name: dishForm.name,
        description: dishForm.description,
        price: price,
        image: dishForm.image,
        category: dishForm.category,
        available: dishForm.available,
      };

      await updateDishInSupabase(editingDish.id, updates);
      
      resetForm();
      setEditingDish(null);
      setShowAddModal(false);
      Alert.alert('Success', 'Dish updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update dish. Please try again.');
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
              // Delete image from storage if it's from Supabase
              if (dish.image.includes('supabase')) {
                await deleteDishImage(dish.image);
              }
              
              await deleteDishFromSupabase(dish.id);
              Alert.alert('Success', 'Dish deleted successfully!');
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

  const handleRefresh = async () => {
    await fetchDishesFromSupabase();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Menu Management</Text>
          <Text style={styles.subtitle}>{dishes.length} dishes available</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading dishes...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {dishes.map((dish) => (
            <View key={dish.id} style={styles.dishCard}>
              <Image source={{ uri: dish.image }} style={styles.dishImage} />
              <View style={styles.dishContent}>
                <View style={styles.dishHeader}>
                  <View style={styles.dishInfo}>
                    <Text style={styles.dishName}>{dish.name}</Text>
                    <Text style={styles.dishCategory}>{dish.category}</Text>
                  </View>
                  <Text style={styles.dishPrice}>{formatCurrency(dish.price)}</Text>
                </View>
                
                <Text style={styles.dishDescription}>{dish.description}</Text>
                
                <View style={styles.dishActions}>
                  <TouchableOpacity
                    style={[
                      styles.availabilityButton,
                      { backgroundColor: dish.available ? '#D1FAE5' : '#FEE2E2' }
                    ]}
                    onPress={() => toggleAvailability(dish.id, !dish.available)}
                  >
                    <Text style={[
                      styles.availabilityText,
                      { color: dish.available ? '#10B981' : '#EF4444' }
                    ]}>
                      {dish.available ? 'Available' : 'Unavailable'}
                    </Text>
                  </TouchableOpacity>
                  
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditDish(dish)}
                    >
                      <Edit size={16} color="#F97316" strokeWidth={2} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteDish(dish)}
                    >
                      <Trash2 size={16} color="#EF4444" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}

          {dishes.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No dishes yet</Text>
              <Text style={styles.emptySubtext}>Add your first dish to get started</Text>
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      )}

      {/* Add/Edit Dish Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingDish ? 'Edit Dish' : 'Add New Dish'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={24} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalForm}>
              {/* Image Preview */}
              {dishForm.image ? (
                <View style={styles.imagePreviewContainer}>
                  <Image 
                    source={{ uri: dishForm.image }} 
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  {isUploadingImage && (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator size="large" color="#fff" />
                      <Text style={styles.uploadingText}>Uploading...</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.changeImageButton}
                    onPress={showImageOptions}
                    disabled={isUploadingImage}
                  >
                    <Upload size={16} color="#fff" strokeWidth={2} />
                    <Text style={styles.changeImageText}>
                      {isUploadingImage ? 'Uploading...' : 'Change Image'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={showImageOptions}
                  disabled={isUploadingImage || isSubmitting}
                >
                  {isUploadingImage ? (
                    <>
                      <ActivityIndicator color="#10B981" size="large" />
                      <Text style={styles.uploadButtonText}>Uploading...</Text>
                    </>
                  ) : (
                    <>
                      <Camera size={32} color="#10B981" strokeWidth={2} />
                      <Text style={styles.uploadButtonText}>Add Dish Image</Text>
                      <Text style={styles.uploadButtonSubtext}>
                        Take photo or choose from gallery
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <TextInput
                style={styles.textInput}
                placeholder="Dish Name *"
                value={dishForm.name}
                onChangeText={(text) => setDishForm(prev => ({ ...prev, name: text }))}
                editable={!isSubmitting && !isUploadingImage}
              />

              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Description *"
                value={dishForm.description}
                onChangeText={(text) => setDishForm(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={3}
                editable={!isSubmitting && !isUploadingImage}
              />

              <TextInput
                style={styles.textInput}
                placeholder="Price in UGX *"
                value={dishForm.price}
                onChangeText={(text) => setDishForm(prev => ({ ...prev, price: text }))}
                keyboardType="numeric"
                editable={!isSubmitting && !isUploadingImage}
              />
              <Text style={styles.inputHelper}>Enter price in UGX (e.g., 44400 for USh 44,400)</Text>

              <View style={styles.categoryContainer}>
                <Text style={styles.categoryLabel}>Category:</Text>
                <View style={styles.categoryButtons}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryButton,
                        dishForm.category === category && styles.selectedCategory
                      ]}
                      onPress={() => setDishForm(prev => ({ ...prev, category }))}
                      disabled={isSubmitting || isUploadingImage}
                    >
                      <Text style={[
                        styles.categoryButtonText,
                        dishForm.category === category && styles.selectedCategoryText
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.availabilityContainer}>
                <Text style={styles.availabilityLabel}>Availability:</Text>
                <View style={styles.availabilityButtons}>
                  <TouchableOpacity
                    style={[
                      styles.availabilityToggle,
                      dishForm.available && styles.selectedAvailability
                    ]}
                    onPress={() => setDishForm(prev => ({ ...prev, available: true }))}
                    disabled={isSubmitting || isUploadingImage}
                  >
                    <Text style={[
                      styles.availabilityToggleText,
                      dishForm.available && styles.selectedAvailabilityText
                    ]}>
                      Available
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.availabilityToggle,
                      !dishForm.available && styles.selectedUnavailability
                    ]}
                    onPress={() => setDishForm(prev => ({ ...prev, available: false }))}
                    disabled={isSubmitting || isUploadingImage}
                  >
                    <Text style={[
                      styles.availabilityToggleText,
                      !dishForm.available && styles.selectedUnavailabilityText
                    ]}>
                      Unavailable
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
                disabled={isSubmitting || isUploadingImage}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.saveButton, (isSubmitting || isUploadingImage) && styles.disabledButton]}
                onPress={editingDish ? handleUpdateDish : handleAddDish}
                disabled={isSubmitting || isUploadingImage}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Save size={16} color="#fff" strokeWidth={2} />
                    <Text style={styles.saveButtonText}>
                      {editingDish ? 'Update' : 'Add'} Dish
                    </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  dishCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  dishImage: {
    width: '100%',
    height: 120,
  },
  dishContent: {
    padding: 16,
  },
  dishHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dishInfo: {
    flex: 1,
  },
  dishName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  dishCategory: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  dishPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F97316',
  },
  dishDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  dishActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#FEF3E2',
    borderRadius: 8,
    padding: 8,
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 8,
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
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalForm: {
    maxHeight: 450,
    marginBottom: 24,
  },
  uploadButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10B981',
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 12,
  },
  uploadButtonSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  imagePreviewContainer: {
    marginBottom: 16,
    position: 'relative',
  },
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
  uploadingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  changeImageButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  changeImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputHelper: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: -12,
    marginBottom: 16,
    marginLeft: 4,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedCategory: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  availabilityContainer: {
    marginBottom: 16,
  },
  availabilityLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  availabilityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  availabilityToggle: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  selectedAvailability: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  selectedUnavailability: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  availabilityToggleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  selectedAvailabilityText: {
    color: '#fff',
  },
  selectedUnavailabilityText: {
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
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#10B981',
    gap: 6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.6,
  },
});