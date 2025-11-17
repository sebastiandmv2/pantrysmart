import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { apiService } from "../services/apiService";

const DEMO_USER_ID = 'demo-user';

export default function AddProductScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  // Datos del formulario
  const [productName, setProductName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("unidades");
  const [storePurchased, setStorePurchased] = useState("");

  // Cargar categorías al montar el componente
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesData = await apiService.inventory.getCategories();
      setCategories(categoriesData.categories);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert("Error", "No se pudieron cargar las categorías");
    }
  };

  const handleAddProduct = async () => {
    // Validaciones
    if (!productName.trim()) {
      Alert.alert("Error", "El nombre del producto es obligatorio");
      return;
    }

    if (!selectedCategory) {
      Alert.alert("Error", "Selecciona una categoría");
      return;
    }

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert("Error", "La cantidad debe ser un número mayor a 0");
      return;
    }

    try {
      setLoading(true);

      const itemData = {
        product_name: productName.trim(),
        category: selectedCategory.id,
        quantity: quantityNum,
        unit: unit.trim() || "unidades",
        store_purchased: storePurchased.trim() || null,
        purchase_date: new Date().toISOString(),
      };

      await apiService.inventory.addItem(DEMO_USER_ID, itemData);

      Alert.alert(
        "¡Producto agregado!",
        `${productName} se agregó exitosamente a tu inventario`,
        [
          {
            text: "Agregar otro",
            onPress: () => {
              // Limpiar formulario
              setProductName("");
              setSelectedCategory(null);
              setQuantity("1");
              setUnit("unidades");
              setStorePurchased("");
            }
          },
          {
            text: "Volver al inicio",
            onPress: () => navigation.navigate('MainTabs', { screen: 'Home' })
          }
        ]
      );

    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert("Error", "No se pudo agregar el producto. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar categoría</Text>
            <TouchableOpacity
              onPress={() => setShowCategoryModal(false)}
              style={styles.modalCloseButton}
            >
              <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item: category }) => (
              <TouchableOpacity
                style={[
                  styles.categoryOption,
                  selectedCategory?.id === category.id && styles.categoryOptionSelected
                ]}
                onPress={() => {
                  setSelectedCategory(category);
                  setShowCategoryModal(false);
                }}
              >
                <View style={styles.categoryOptionContent}>
                  <View style={[styles.categoryIcon, { backgroundColor: category.color_light }]}>
                    <MaterialCommunityIcons 
                      name={category.icon} 
                      size={20} 
                      color={category.color} 
                    />
                  </View>
                  <Text style={[
                    styles.categoryOptionText,
                    selectedCategory?.id === category.id && styles.categoryOptionTextSelected
                  ]}>
                    {category.name}
                  </Text>
                </View>
                {selectedCategory?.id === category.id && (
                  <MaterialCommunityIcons name="check" size={20} color="#2f7d36" />
                )}
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Agregar Producto</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Nombre del producto */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre del producto *</Text>
          <TextInput
            style={styles.textInput}
            value={productName}
            onChangeText={setProductName}
            placeholder="Ej: Arroz integral, Leche entera, etc."
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Categoría */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Categoría *</Text>
          <TouchableOpacity
            style={styles.categorySelector}
            onPress={() => setShowCategoryModal(true)}
          >
            {selectedCategory ? (
              <View style={styles.selectedCategoryContent}>
                <View style={[styles.categoryIcon, { backgroundColor: selectedCategory.color_light }]}>
                  <MaterialCommunityIcons 
                    name={selectedCategory.icon} 
                    size={20} 
                    color={selectedCategory.color} 
                  />
                </View>
                <Text style={styles.selectedCategoryText}>{selectedCategory.name}</Text>
              </View>
            ) : (
              <Text style={styles.categorySelectorPlaceholder}>Seleccionar categoría</Text>
            )}
            <MaterialCommunityIcons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Cantidad y Unidad */}
        <View style={styles.rowInputs}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Cantidad *</Text>
            <TextInput
              style={styles.textInput}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="1"
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Unidad</Text>
            <TextInput
              style={styles.textInput}
              value={unit}
              onChangeText={setUnit}
              placeholder="kg, litros, unidades"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {/* Tienda (opcional) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tienda (opcional)</Text>
          <TextInput
            style={styles.textInput}
            value={storePurchased}
            onChangeText={setStorePurchased}
            placeholder="¿Dónde lo compraste?"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Información adicional */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information" size={20} color="#2f7d36" />
          <Text style={styles.infoText}>
            El producto se agregará a tu inventario personal y podrás usarlo para recetas y listas de compras.
          </Text>
        </View>
      </ScrollView>

      {/* Botón de agregar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.addButton, loading && styles.addButtonDisabled]}
          onPress={handleAddProduct}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Agregar al inventario</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {renderCategoryModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#111",
    backgroundColor: "#fff",
  },
  categorySelector: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },
  selectedCategoryContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedCategoryText: {
    fontSize: 16,
    color: "#111",
    fontWeight: "500",
  },
  categorySelectorPlaceholder: {
    fontSize: 16,
    color: "#9ca3af",
  },
  rowInputs: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  infoCard: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#d1fae5",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#065f46",
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  addButton: {
    backgroundColor: "#2f7d36",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  addButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
  },
  modalCloseButton: {
    padding: 4,
  },
  categoryOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  categoryOptionSelected: {
    backgroundColor: "#ecfdf5",
  },
  categoryOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  categoryOptionText: {
    fontSize: 16,
    color: "#111",
  },
  categoryOptionTextSelected: {
    color: "#2f7d36",
    fontWeight: "600",
  },
});