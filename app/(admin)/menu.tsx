import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Modal, Image } from 'react-native';
import { Plus, CreditCard as Edit, Trash2, Save, X } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { Dish } from '../../types';

export default function AdminMenuScreen() {
  const { state, dispatch } = useApp();
  const { dishes } = state;
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
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

  const handleAddDish = () => {
    if (!dishForm.name || !dishForm.description || !dishForm.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const price = parseFloat(dishForm.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    const newDish: Dish = {
      id: Date.now().toString(),
      name: dishForm.name,
      description: dishForm.description,
      price: price,
      image: dishForm.image || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=300',
      category: dishForm.category,
      available: dishForm.available,
    };

    dispatch({ type: 'ADD_DISH', dish: newDish });
    resetForm();
    setShowAddModal(false);
    Alert.alert('Success', 'Dish added successfully!');
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

  const handleUpdateDish = () => {
    if (!editingDish || !dishForm.name || !dishForm.description || !dishForm.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const price = parseFloat(dishForm.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    const updates: Partial<Dish> = {
      name: dishForm.name,
      description: dishForm.description,
      price: price,
      image: dishForm.image,
      category: dishForm.category,
      available: dishForm.available,
    };

    dispatch({ type: 'UPDATE_DISH', dishId: editingDish.id, updates });
    resetForm();
    setEditingDish(null);
    setShowAddModal(false);
    Alert.alert('Success', 'Dish updated successfully!');
  };

  const handleDeleteDish = (dishId: string) => {
    Alert.alert(
      'Delete Dish',
      'Are you sure you want to delete this dish?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch({ type: 'DELETE_DISH', dishId }),
        },
      ]
    );
  };

  const toggleAvailability = (dishId: string, available: boolean) => {
    dispatch({ type: 'UPDATE_DISH', dishId, updates: { available } });
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingDish(null);
    resetForm();
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
                <Text style={styles.dishPrice}>${dish.price.toFixed(2)}</Text>
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
                    onPress={() => handleDeleteDish(dish.id)}
                  >
                    <Trash2 size={16} color="#EF4444" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.bottomPadding} />
      </ScrollView>

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
              <TextInput
                style={styles.textInput}
                placeholder="Dish Name *"
                value={dishForm.name}
                onChangeText={(text) => setDishForm(prev => ({ ...prev, name: text }))}
              />

              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Description *"
                value={dishForm.description}
                onChangeText={(text) => setDishForm(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={3}
              />

              <TextInput
                style={styles.textInput}
                placeholder="Price *"
                value={dishForm.price}
                onChangeText={(text) => setDishForm(prev => ({ ...prev, price: text }))}
                keyboardType="decimal-pad"
              />

              <TextInput
                style={styles.textInput}
                placeholder="Image URL (optional)"
                value={dishForm.image}
                onChangeText={(text) => setDishForm(prev => ({ ...prev, image: text }))}
              />

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
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={editingDish ? handleUpdateDish : handleAddDish}
              >
                <Save size={16} color="#fff" strokeWidth={2} />
                <Text style={styles.saveButtonText}>
                  {editingDish ? 'Update' : 'Add'} Dish
                </Text>
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
    maxHeight: '80%',
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
    maxHeight: 400,
    marginBottom: 24,
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
});