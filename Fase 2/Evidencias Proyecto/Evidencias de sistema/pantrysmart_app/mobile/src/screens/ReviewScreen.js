import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useReceiptScan } from "../hooks/useReceiptScan";

const CATEGORIES = ['Alimentos','Bebidas','Higiene','Limpieza','Salud','Mascotas','Hogar','Bebé','Alcohol','Otros'];

export default function ReviewScreen({ route, navigation }) {
  const { imageUri, extractedData } = route.params || {};
  const [receiptData, setReceiptData] = useState(null);
  const [items, setItems] = useState([]);
  const { loading, confirmReceipt } = useReceiptScan();

  useEffect(() => {
    if (extractedData) {
      setReceiptData(extractedData);
      // Convertir items para el estado local con IDs únicos
      const processedItems = extractedData.items?.map((item, index) => ({
        id: index.toString(),
        product_name: item.product_name || '',
        category: item.category || 'Otros',
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        total_price: item.total_price || 0,
      })) || [];
      setItems(processedItems);
    }
  }, [extractedData]);

  const updateItem = (id, field, value) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === id 
          ? { 
              ...item, 
              [field]: field === 'quantity' || field === 'unit_price' || field === 'total_price' 
                ? parseInt(value) || 0 
                : value 
            }
          : item
      )
    );
  };

  const removeItem = (id) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const addNewItem = () => {
    const newId = Date.now().toString();
    setItems(prevItems => [...prevItems, {
      id: newId,
      product_name: '',
      category: 'Otros',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
    }]);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.total_price || 0), 0);
  };

  const handleConfirm = async () => {
    // Validar que todos los items tengan datos mínimos
    const validItems = items.filter(item => 
      item.product_name.trim() && 
      item.quantity > 0 && 
      item.unit_price >= 0
    );

    if (validItems.length === 0) {
      Alert.alert("Error", "Debe tener al menos un producto válido");
      return;
    }

    // Preparar datos para envío
    const confirmData = {
      user_id: "demo-user", // Por ahora usamos usuario demo
      store: receiptData?.store || "Tienda",
      date: receiptData?.date || new Date().toISOString().split('T')[0],
      time: receiptData?.time || new Date().toTimeString().split(' ')[0],
      items: validItems.map(item => ({
        product_name: item.product_name,
        category: item.category,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      })),
      subtotal: calculateSubtotal(),
    };

    try {
      await confirmReceipt(confirmData);
      Alert.alert(
        "¡Éxito!", 
        "La boleta ha sido guardada correctamente",
        [{ text: "OK", onPress: () => navigation.navigate("Home") }]
      );
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar la boleta. Intente nuevamente.");
    }
  };

  if (!receiptData) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Cargando datos...</Text>
        <ActivityIndicator size="large" color="#2f7d36" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header con imagen */}
        <View style={styles.header}>
          <Text style={styles.title}>Revisar Boleta</Text>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.receiptImage} />
          )}
        </View>

        {/* Info de la boleta */}
        <View style={styles.receiptInfo}>
          <Text style={styles.storeName}>{receiptData.store}</Text>
          <Text style={styles.receiptDate}>{receiptData.date} - {receiptData.time}</Text>
        </View>

        {/* Lista de productos */}
        <View style={styles.itemsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Productos detectados</Text>
            <TouchableOpacity onPress={addNewItem} style={styles.addButton}>
              <MaterialCommunityIcons name="plus" size={20} color="#2f7d36" />
            </TouchableOpacity>
          </View>

          {items.map((item) => (
            <ProductItem
              key={item.id}
              item={item}
              onUpdate={updateItem}
              onRemove={removeItem}
            />
          ))}
        </View>

        {/* Resumen */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Resumen</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Productos:</Text>
            <Text style={styles.summaryValue}>{items.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>${calculateSubtotal().toLocaleString()}</Text>
          </View>
        </View>

        {/* Botones de acción */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.confirmButton} 
            onPress={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirmar y Guardar</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// Componente para cada producto
function ProductItem({ item, onUpdate, onRemove }) {
  return (
    <View style={styles.productItem}>
      <View style={styles.productHeader}>
        <TextInput
          style={styles.productNameInput}
          value={item.product_name}
          onChangeText={(text) => onUpdate(item.id, 'product_name', text)}
          placeholder="Nombre del producto"
          multiline
        />
        <TouchableOpacity 
          onPress={() => onRemove(item.id)}
          style={styles.removeButton}
        >
          <MaterialCommunityIcons name="close" size={20} color="#dc2626" />
        </TouchableOpacity>
      </View>

      <View style={styles.productDetails}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Cantidad</Text>
          <TextInput
            style={styles.numberInput}
            value={item.quantity.toString()}
            onChangeText={(text) => onUpdate(item.id, 'quantity', text)}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Precio Unit.</Text>
          <TextInput
            style={styles.numberInput}
            value={item.unit_price.toString()}
            onChangeText={(text) => onUpdate(item.id, 'unit_price', text)}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Total</Text>
          <TextInput
            style={styles.numberInput}
            value={item.total_price.toString()}
            onChangeText={(text) => onUpdate(item.id, 'total_price', text)}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.categorySection}>
        <Text style={styles.inputLabel}>Categoría:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.categoryButtons}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  item.category === category && styles.categoryButtonActive
                ]}
                onPress={() => onUpdate(item.id, 'category', category)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  item.category === category && styles.categoryButtonTextActive
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111",
  },
  receiptImage: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    resizeMode: "cover",
  },
  receiptInfo: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  storeName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
  },
  receiptDate: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  itemsSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
  },
  addButton: {
    backgroundColor: "#ecfdf5",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2f7d36",
  },
  productItem: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  productHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  productNameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 4,
    marginRight: 12,
  },
  removeButton: {
    padding: 4,
  },
  productDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 4,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 8,
    textAlign: "center",
    fontSize: 14,
  },
  categorySection: {
    marginTop: 8,
  },
  categoryButtons: {
    flexDirection: "row",
    gap: 8,
  },
  categoryButton: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  categoryButtonActive: {
    backgroundColor: "#2f7d36",
    borderColor: "#2f7d36",
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  categoryButtonTextActive: {
    color: "#fff",
  },
  summary: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#111",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  confirmButton: {
    flex: 2,
    backgroundColor: "#2f7d36",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
