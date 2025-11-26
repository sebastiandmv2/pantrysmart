import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { apiService } from "../services/apiService";

export default function ReceiptDetailScreen({ route, navigation }) {
  const { receiptId } = route.params;
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReceiptDetail();
  }, [receiptId]);

  const loadReceiptDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const receiptData = await apiService.receipts.getById(receiptId);
      setReceipt(receiptData);
    } catch (err) {
      console.error('Error loading receipt detail:', err);
      setError("Error al cargar el detalle de la boleta");
      Alert.alert(
        "Error",
        "No se pudo cargar el detalle de la boleta",
        [{ text: "Volver", onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-CL', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const getProductTypeIcon = (productType) => {
    const iconMap = {
      'Arroz': 'rice',
      'Fideos': 'noodles',
      'Leche': 'cup',
      'Queso': 'cheese',
      'Yogur': 'cup-outline',
      'Atun': 'fish',
      'Pan': 'bread-slice',
      'Huevo': 'egg',
      'Azucar': 'cube-outline',
      'Harina': 'sack',
      'Aceite': 'bottle-tonic',
      'Sal': 'shaker-outline',
      'Mantequilla': 'butter',
      'Pollo': 'food-drumstick',
      'Carne molida': 'food-steak',
      'Manzana': 'apple',
      'Platano': 'fruit-pineapple',
      'Cebolla': 'onion',
      'Tomate': 'tomato',
      'Ajo': 'garlic',
      'Zanahoria': 'carrot',
      'Helado': 'ice-cream',
      'Otros': 'package-variant',
    };
    return iconMap[productType] || 'package-variant';
  };

  const getProductTypeColor = (productType) => {
    // Colores basados en categorías de alimentos
    const colorMap = {
      'Arroz': '#059669', 'Fideos': '#059669', 'Harina': '#059669', 'Azucar': '#059669', 'Sal': '#059669', // Abarrotes
      'Leche': '#0ea5e9', 'Queso': '#0ea5e9', 'Yogur': '#0ea5e9', 'Mantequilla': '#0ea5e9', // Lácteos
      'Pollo': '#dc2626', 'Carne molida': '#dc2626', 'Atun': '#dc2626', // Carnes
      'Pan': '#d97706', // Panadería
      'Manzana': '#10b981', 'Platano': '#10b981', // Frutas
      'Cebolla': '#16a34a', 'Tomate': '#16a34a', 'Ajo': '#16a34a', 'Zanahoria': '#16a34a', // Verduras
      'Helado': '#8b5cf6', // Congelados
      'Aceite': '#f59e0b', 'Huevo': '#f59e0b', // Condimentos/otros
      'Otros': '#6b7280',
    };
    return colorMap[productType] || '#6b7280';
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={[styles.productIcon, { backgroundColor: getProductTypeColor(item.product_type) + '20' }]}>
          <MaterialCommunityIcons 
            name={getProductTypeIcon(item.product_type)} 
            size={20} 
            color={getProductTypeColor(item.product_type)} 
          />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.product_name}</Text>
          <Text style={styles.itemType}>{item.product_type}</Text>
        </View>
      </View>
      
      <View style={styles.itemDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Cantidad:</Text>
          <Text style={styles.detailValue}>{item.quantity}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Estado:</Text>
          <Text style={[styles.detailValue, item.is_active ? styles.activeStatus : styles.inactiveStatus]}>
            {item.is_active ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2f7d36" />
        <Text style={styles.loadingText}>Cargando detalle...</Text>
      </View>
    );
  }

  if (error || !receipt) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#dc2626" />
        <Text style={styles.errorText}>Error al cargar la boleta</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadReceiptDetail}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        <Text style={styles.title}>Detalle de Boleta</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Receipt Info */}
      <View style={styles.receiptInfo}>
        <View style={styles.storeHeader}>
          <MaterialCommunityIcons name="store" size={24} color="#2f7d36" />
          <Text style={styles.storeName}>{receipt.store}</Text>
        </View>
        <Text style={styles.receiptDate}>{formatDate(receipt.created_at)}</Text>
        <Text style={styles.receiptTime}>{formatTime(receipt.created_at)}</Text>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total de productos:</Text>
          <Text style={styles.summaryValue}>{receipt.items?.length || 0}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Productos activos:</Text>
          <Text style={styles.summaryValue}>{receipt.items?.filter(item => item.is_active).length || 0}</Text>
        </View>
      </View>

      {/* Items List */}
      <View style={styles.itemsSection}>
        <Text style={styles.sectionTitle}>Productos de Inventario</Text>
        <FlatList
          data={receipt.items || []}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      </View>
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
  receiptInfo: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  storeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  storeName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
  },
  receiptDate: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 4,
    textTransform: "capitalize",
  },
  receiptTime: {
    fontSize: 14,
    color: "#6b7280",
  },
  summary: {
    backgroundColor: "#ecfdf5",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1fae5",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#374151",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  summaryTotal: {
    fontSize: 16,
    color: "#059669",
  },
  itemsSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
    marginBottom: 12,
  },
  itemCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  productIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    marginBottom: 2,
  },
  itemType: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  itemDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111",
  },
  activeStatus: {
    fontWeight: "600",
    color: "#059669",
  },
  inactiveStatus: {
    fontWeight: "600",
    color: "#dc2626",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    color: "#dc2626",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#2f7d36",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});