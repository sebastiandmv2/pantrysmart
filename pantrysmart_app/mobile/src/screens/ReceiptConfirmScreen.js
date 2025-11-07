import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useReceiptScan } from "../hooks/useReceiptScan";

// Tipos de productos disponibles
const PRODUCT_TYPES = [
  // Abarrotes básicos
  'Arroz', 'Fideos', 'Fideo', 'Azucar', 'Harina', 'Aceite', 'Sal',
  // Lácteos
  'Leche', 'Leche evaporada', 'Queso', 'Yogur', 'Mantequilla',
  // Carnes y proteínas
  'Atun', 'Pollo', 'Carne molida', 'Hamburguesa', 'Huevo',
  // Panadería
  'Pan', 'Gallina',
  // Frutas
  'Manzana', 'Platano', 'Fruta', 'Berries',
  // Verduras
  'Cebolla', 'Tomate', 'Ajo', 'Zanahoria',
  // Condimentos y salsas
  'Salsa de tomate', 'Sopa',
  // Pastas
  'Ravioles',
  // Congelados
  'Helado',
  // Otros
  'Otros'
];

export default function ReceiptConfirmScreen({ route, navigation }) {
  const { extractedData } = route.params;
  const { confirmReceipt, loading } = useReceiptScan();
  
  const [items, setItems] = useState([]);
  const [store, setStore] = useState("");
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    if (extractedData) {
      setStore(extractedData.store || "");
      setItems(extractedData.items || []);
    }
  }, [extractedData]);

  const handleQuantityChange = (index, newQuantity) => {
    const quantity = parseInt(newQuantity) || 1;
    if (quantity < 1) return;
    
    const updatedItems = [...items];
    updatedItems[index].quantity = quantity;
    setItems(updatedItems);
  };

  const handleTypeChange = (index, newType) => {
    const updatedItems = [...items];
    updatedItems[index].product_type = newType;
    setItems(updatedItems);
    setShowTypeModal(false);
    setEditingItem(null);
  };

  const removeItem = (index) => {
    Alert.alert(
      "Eliminar producto",
      "¿Estás seguro de que quieres eliminar este producto?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: () => {
            const updatedItems = items.filter((_, i) => i !== index);
            setItems(updatedItems);
          }
        }
      ]
    );
  };

  const handleConfirm = async () => {
    if (items.length === 0) {
      Alert.alert("Error", "Debe haber al menos un producto para guardar la boleta");
      return;
    }

    try {
      const receiptData = {
        user_id: "demo-user", // Por ahora usamos usuario demo
        store: store,
        items: items
      };

      const result = await confirmReceipt(receiptData);
      
      Alert.alert(
        "¡Boleta guardada!",
        "La boleta se ha guardado exitosamente en tu inventario",
        [
          {
            text: "Ver boletas",
            onPress: () => {
              navigation.navigate('Receipts');
            }
          },
          {
            text: "Volver al inicio",
            onPress: () => {
              navigation.navigate('MainTabs', { screen: 'Home' });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error confirming receipt:', error);
      Alert.alert(
        "Error",
        "No se pudo guardar la boleta. Intenta nuevamente."
      );
    }
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.product_name}</Text>
          <TouchableOpacity
            style={styles.typeButton}
            onPress={() => {
              setEditingItem(index);
              setShowTypeModal(true);
            }}
          >
            <Text style={styles.typeButtonText}>{item.product_type}</Text>
            <MaterialCommunityIcons name="chevron-down" size={16} color="#2f7d36" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeItem(index)}
        >
          <MaterialCommunityIcons name="close" size={20} color="#dc2626" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.quantityContainer}>
        <Text style={styles.quantityLabel}>Cantidad:</Text>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(index, item.quantity - 1)}
          >
            <MaterialCommunityIcons name="minus" size={20} color="#2f7d36" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.quantityInput}
            value={item.quantity.toString()}
            onChangeText={(text) => handleQuantityChange(index, text)}
            keyboardType="numeric"
            selectTextOnFocus
          />
          
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(index, item.quantity + 1)}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#2f7d36" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderTypeModal = () => (
    <Modal
      visible={showTypeModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowTypeModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar tipo de producto</Text>
            <TouchableOpacity
              onPress={() => setShowTypeModal(false)}
              style={styles.modalCloseButton}
            >
              <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={PRODUCT_TYPES}
            keyExtractor={(item) => item}
            renderItem={({ item: type }) => (
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  editingItem !== null && items[editingItem]?.product_type === type && styles.typeOptionSelected
                ]}
                onPress={() => handleTypeChange(editingItem, type)}
              >
                <Text style={[
                  styles.typeOptionText,
                  editingItem !== null && items[editingItem]?.product_type === type && styles.typeOptionTextSelected
                ]}>
                  {type}
                </Text>
                {editingItem !== null && items[editingItem]?.product_type === type && (
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
        <Text style={styles.title}>Confirmar Boleta</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Store Info */}
      <View style={styles.storeSection}>
        <Text style={styles.sectionTitle}>Tienda</Text>
        <TextInput
          style={styles.storeInput}
          value={store}
          onChangeText={setStore}
          placeholder="Nombre de la tienda"
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Items List */}
      <View style={styles.itemsSection}>
        <Text style={styles.sectionTitle}>
          Productos de inventario ({items.length})
        </Text>
        
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="cart-off" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>
              No se encontraron productos de inventario en esta boleta
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
        )}
      </View>

      {/* Confirm Button */}
      {items.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
            onPress={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={20} color="#fff" />
                <Text style={styles.confirmButtonText}>Guardar boleta</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {renderTypeModal()}
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
  storeSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    marginBottom: 8,
  },
  storeInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#111",
  },
  itemsSection: {
    flex: 1,
    padding: 16,
  },
  itemCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    marginBottom: 8,
  },
  typeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#2f7d36",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  typeButtonText: {
    color: "#2f7d36",
    fontSize: 14,
    fontWeight: "500",
    marginRight: 4,
  },
  removeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#fee2e2",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quantityLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#2f7d36",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityInput: {
    width: 50,
    height: 32,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 16,
    color: "#111",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  confirmButton: {
    backgroundColor: "#2f7d36",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  confirmButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 24,
  },
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
  typeOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  typeOptionSelected: {
    backgroundColor: "#ecfdf5",
  },
  typeOptionText: {
    fontSize: 16,
    color: "#111",
  },
  typeOptionTextSelected: {
    color: "#2f7d36",
    fontWeight: "600",
  },
});