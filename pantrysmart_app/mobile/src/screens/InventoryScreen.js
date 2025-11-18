import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { apiService } from "../services/apiService";

const DEMO_USER_ID = 'demo-user';

// Mapeo de iconos por categoría
const CATEGORY_ICONS = {
  'Abarrotes': 'package-variant-closed',
  'Lácteos': 'cup',
  'Carnes': 'food-drumstick',
  'Embutidos': 'sausage',
  'Panadería': 'bread-slice',
  'Verduras': 'sprout',
  'Frutas': 'apple',
  'Congelados': 'snowflake',
  'Dulces': 'candy',
  'Snacks': 'popcorn',
  'Condimentos': 'shaker-outline',
  'Bebestibles': 'cup-water',
  'Limpieza': 'spray-bottle',
  'Cuidado Personal': 'face-woman',
  'Mascotas': 'dog',
  'Hogar': 'home-variant'
};

// Mapeo de iconos por tipo de producto
const PRODUCT_TYPE_ICONS = {
  'Leche': 'cup',
  'Queso': 'cheese',
  'Yogur': 'cup-outline',
  'Mantequilla': 'butter',
  'Huevo': 'egg',
  'Pollo': 'food-drumstick',
  'Carne': 'food-steak',
  'Atún': 'fish',
  'Lechuga': 'leaf',
  'Tomate': 'tomato',
  'Cebolla': 'onion',
  'Zanahoria': 'carrot',
  'Papa': 'potato',
  'Manzana': 'apple',
  'Plátano': 'fruit-pineapple',
  'Naranja': 'orange',
  'Limón': 'lemon',
  'Palta': 'avocado',
  'Arroz': 'rice',
  'Fideos': 'noodles',
  'Pan': 'bread-slice',
  'Harina': 'sack',
  'Azúcar': 'cube-outline',
  'Aceite': 'bottle-tonic',
  'Sal': 'shaker-outline',
  'Agua': 'water',
  'Bebida': 'bottle-soda',
  'Jugo': 'cup-water',
};

export default function InventoryScreen({ navigation, route }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groupedInventory, setGroupedInventory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('categories'); // 'categories', 'grouped' o 'detailed'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'

  // Cargar datos del inventario
  const loadInventoryData = async () => {
    try {
      setError(null);
      
      // Siempre cargar el summary básico
      const summaryResponse = await apiService.inventory.getSummary(DEMO_USER_ID);
      setSummary(summaryResponse);
      
      if (viewMode === 'categories') {
        // Cargar vista por categorías
        const inventoryItems = await apiService.inventory.getItems(DEMO_USER_ID);
        
        // Procesar categorías con conteos
        const categoryMap = {};
        inventoryItems.forEach(item => {
          const category = item.product?.category || 'Otros';
          if (!categoryMap[category]) {
            categoryMap[category] = {
              name: category,
              count: 0,
              totalQuantity: 0,
              items: []
            };
          }
          categoryMap[category].count += 1;
          categoryMap[category].totalQuantity += item.current_quantity || 0;
          categoryMap[category].items.push(item);
        });
        
        const categoriesArray = Object.values(categoryMap);
        setCategories(categoriesArray);
        setGroupedInventory([]);
        
      } else if (selectedCategory) {
        // Cargar productos de una categoría específica
        const categoryItems = await apiService.inventory.getByCategory(DEMO_USER_ID, selectedCategory);
        setGroupedInventory(categoryItems || []);
        
      } else if (viewMode === 'grouped') {
        // Cargar inventario agrupado por tipo genérico
        const groupedResponse = await apiService.inventory.getGroupedInventory(DEMO_USER_ID);
        
        setGroupedInventory(groupedResponse.grouped_inventory || []);
        
        // Actualizar summary con datos agrupados si está disponible
        const totalTypes = groupedResponse.total_generic_types || groupedResponse.total_types || (groupedResponse.grouped_inventory?.length) || 0;
        if (totalTypes > 0) {
          setSummary(prev => ({
            ...prev,
            total_generic_types: totalTypes
          }));
        }
      } else {
        // Cargar inventario detallado
        const detailedResponse = await apiService.inventory.getItems(DEMO_USER_ID);
        setGroupedInventory(detailedResponse || []);
      }
      
    } catch (err) {
      console.error('Error loading inventory:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refrescar datos
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInventoryData();
  }, [viewMode, selectedCategory]);

  // Cargar datos al montar y cuando cambia el modo de vista o categoría
  useEffect(() => {
    loadInventoryData();
  }, [viewMode, selectedCategory]);

  // Detectar cuando se navega desde el home con una categoría específica
  useEffect(() => {
    const categoryFromRoute = route?.params?.selectedCategory;
    if (categoryFromRoute && categoryFromRoute !== selectedCategory) {
      setSelectedCategory(categoryFromRoute);
      setViewMode('detailed');
    }
  }, [route?.params?.selectedCategory]);

  // Refrescar al obtener foco
  useFocusEffect(
    useCallback(() => {
      loadInventoryData();
    }, [viewMode, selectedCategory])
  );

  // Color neutro para todos los productos
  const getProductColor = () => {
    return '#2f7d36';
  };

  // Función para obtener datos ordenados según el filtro alfabético
  const getSortedData = () => {
    if (viewMode === 'categories') {
      if (sortOrder === 'asc') {
        return [...categories].sort((a, b) => a.name.localeCompare(b.name));
      } else {
        return [...categories].sort((a, b) => b.name.localeCompare(a.name));
      }
    } else {
      if (sortOrder === 'asc') {
        return [...groupedInventory].sort((a, b) => {
          const nameA = viewMode === 'grouped' ? a.product_type : a.product?.name;
          const nameB = viewMode === 'grouped' ? b.product_type : b.product?.name;
          return nameA.localeCompare(nameB);
        });
      } else {
        return [...groupedInventory].sort((a, b) => {
          const nameA = viewMode === 'grouped' ? a.product_type : a.product?.name;
          const nameB = viewMode === 'grouped' ? b.product_type : b.product?.name;
          return nameB.localeCompare(nameA);
        });
      }
    }
  };



  const renderGroupedItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.inventoryCard}
      onPress={() => {
        // TODO: Navegar a detalle del producto
        Alert.alert(
          item.product_type,
          `${item.items_count} tipo(s) diferentes\nTotal: ${item.total_quantity} ${item.unit}`,
          [
            { text: "Ver detalles", onPress: () => console.log('Ver detalles:', item) },
            { text: "Cerrar", style: "cancel" }
          ]
        );
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.productInfo}>
          <View style={[styles.productIcon, { backgroundColor: getProductColor() + '20' }]}>
            <MaterialCommunityIcons 
              name={PRODUCT_TYPE_ICONS[item.product_type] || 'package-variant'} 
              size={24} 
              color={getProductColor()} 
            />
          </View>
          <View style={styles.productDetails}>
            <Text style={styles.productName}>{item.product_type}</Text>
            <Text style={styles.productCategory}>{item.category}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.quantityInfo}>
          <Text style={styles.quantityText}>
            {item.total_quantity} {item.unit}
          </Text>
          {item.items_count > 1 && (
            <Text style={styles.varietiesText}>
              {item.items_count} variedades
            </Text>
          )}
        </View>
        

      </View>
    </TouchableOpacity>
  );

  const renderDetailedItem = ({ item }) => (
    <TouchableOpacity style={styles.inventoryCard}>
      <View style={styles.cardHeader}>
        <View style={styles.productInfo}>
          <View style={[styles.productIcon, { backgroundColor: getProductColor() + '20' }]}>
            <MaterialCommunityIcons 
              name={PRODUCT_TYPE_ICONS[item.product?.name?.split(' ')[0]] || 'package-variant'} 
              size={24} 
              color={getProductColor()} 
            />
          </View>
          <View style={styles.productDetails}>
            <Text style={styles.productName}>{item.product?.name}</Text>
            <Text style={styles.productCategory}>{item.product?.category}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.quantityInfo}>
          <Text style={styles.quantityText}>
            {item.current_quantity} {item.unit}
          </Text>
          {item.store_purchased && (
            <Text style={styles.storeText}>
              {item.store_purchased}
            </Text>
          )}
        </View>
        

      </View>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.categoryCard}
      onPress={() => {
        setSelectedCategory(item.name);
        setViewMode('detailed');
      }}
    >
      <View style={styles.categoryHeader}>
        <View style={[styles.categoryIcon, { backgroundColor: '#2f7d36' + '20' }]}>
          <MaterialCommunityIcons 
            name={CATEGORY_ICONS[item.name] || 'package-variant'} 
            size={32} 
            color="#2f7d36" 
          />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{item.name}</Text>
          <Text style={styles.categoryCount}>{item.count} productos</Text>
        </View>
      </View>
      
      <View style={styles.categoryFooter}>
        <Text style={styles.categoryQuantity}>
          Total: {Math.round(item.totalQuantity * 100) / 100} unidades
        </Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color="#6b7280" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2f7d36" />
        <Text style={styles.loadingText}>Cargando inventario...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            if (selectedCategory) {
              // Si estamos en una categoría, volver a la vista de categorías
              setSelectedCategory(null);
              setViewMode('categories');
              // Limpiar parámetros de navegación
              navigation.setParams({ selectedCategory: undefined });
            } else {
              // Si estamos en la vista principal, volver al home
              navigation.goBack();
            }
          }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {selectedCategory ? selectedCategory : 'Mi Inventario'}
        </Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => {
            Alert.alert(
              "Ordenar",
              "Selecciona el orden alfabético",
              [
                { text: "A-Z", onPress: () => setSortOrder('asc') },
                { text: "Z-A", onPress: () => setSortOrder('desc') },
                { text: "Cancelar", style: "cancel" }
              ]
            );
          }}
        >
          <MaterialCommunityIcons 
            name={sortOrder === 'asc' ? 'sort-ascending' : 'sort-descending'} 
            size={24} 
            color="#2f7d36" 
          />
        </TouchableOpacity>
      </View>

      {/* View Mode Toggle */}
      {!selectedCategory && (
        <View style={styles.viewToggleContainer}>
          <TouchableOpacity 
            style={[styles.viewToggleButton, viewMode === 'categories' && styles.viewToggleActive]}
            onPress={() => setViewMode('categories')}
          >
            <Text style={[styles.viewToggleText, viewMode === 'categories' && styles.viewToggleTextActive]}>
              Ver por categorías
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.viewToggleButton, viewMode !== 'categories' && styles.viewToggleActive]}
            onPress={() => setViewMode('grouped')}
          >
            <Text style={[styles.viewToggleText, viewMode !== 'categories' && styles.viewToggleTextActive]}>
              Todos los productos
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Indicador de filtro alfabético */}
      <View style={styles.filterIndicator}>
        <MaterialCommunityIcons 
          name={sortOrder === 'asc' ? 'sort-ascending' : 'sort-descending'} 
          size={16} 
          color="#2f7d36" 
        />
        <Text style={styles.filterIndicatorText}>
          Ordenado {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
        </Text>
      </View>

      {/* Summary - Solo mostrar cuando NO hay categoría seleccionada */}
      {!selectedCategory && (summary || categories.length > 0 || groupedInventory.length > 0) && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              {viewMode === 'categories' ? 'Categorías' : viewMode === 'grouped' ? 'Tipos de productos' : 'Total productos'}
            </Text>
            <Text style={styles.summaryValue}>
              {viewMode === 'categories' ? categories.length : viewMode === 'grouped' ? (summary?.total_generic_types || groupedInventory.length) : (summary?.total_products || groupedInventory.length)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Productos únicos</Text>
            <Text style={styles.summaryValue}>
              {summary?.total_products || groupedInventory.length || 0}
            </Text>
          </View>
        </View>
      )}

      {/* Lista de inventario */}
      {error ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#dc2626" />
          <Text style={styles.errorText}>Error cargando inventario</Text>
          <Text style={styles.errorDetail}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadInventoryData}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : viewMode === 'categories' && categories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="package-variant" size={64} color="#9ca3af" />
          <Text style={styles.emptyTitle}>Inventario vacío</Text>
          <Text style={styles.emptyText}>
            Escanea tu primera boleta o agrega productos manualmente para comenzar
          </Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate("Scan")}
          >
            <MaterialCommunityIcons name="camera" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Escanear boleta</Text>
          </TouchableOpacity>
        </View>
      ) : groupedInventory.length === 0 && viewMode !== 'categories' ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="package-variant" size={64} color="#9ca3af" />
          <Text style={styles.emptyTitle}>
            {selectedCategory ? `Sin productos en ${selectedCategory}` : 'Inventario vacío'}
          </Text>
          <Text style={styles.emptyText}>
            {selectedCategory ? 'No tienes productos en esta categoría' : 'Escanea tu primera boleta o agrega productos manualmente para comenzar'}
          </Text>
          {!selectedCategory && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate("Scan")}
            >
              <MaterialCommunityIcons name="camera" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Escanear boleta</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={getSortedData()}
          renderItem={viewMode === 'categories' ? renderCategoryItem : viewMode === 'grouped' ? renderGroupedItem : renderDetailedItem}
          keyExtractor={(item, index) => {
            if (viewMode === 'categories') return item.name;
            if (viewMode === 'grouped') return item.product_type;
            return item.id?.toString() || index.toString();
          }}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2f7d36"]}
              tintColor="#2f7d36"
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    fontSize: 20,
    fontWeight: "600",
    color: "#111",
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  summaryContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
    textAlign: "center",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
  },
  listContainer: {
    padding: 16,
  },
  inventoryCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  productInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  productIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },

  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantityInfo: {
    flex: 1,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 2,
  },
  varietiesText: {
    fontSize: 12,
    color: "#6b7280",
  },
  storeText: {
    fontSize: 12,
    color: "#6b7280",
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
    gap: 12,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#dc2626",
    textAlign: "center",
  },
  errorDetail: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#2f7d36",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: "#2f7d36",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  viewToggleContainer: {
    flexDirection: "row",
    margin: 16,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 4,
  },
  viewToggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  viewToggleActive: {
    backgroundColor: "#2f7d36",
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  viewToggleTextActive: {
    color: "#fff",
  },
  categoryCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 14,
    color: "#6b7280",
  },
  categoryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryQuantity: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2f7d36",
  },
  filterIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#ecfdf5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#a7f3d0",
    gap: 6,
  },
  filterIndicatorText: {
    fontSize: 12,
    color: "#2f7d36",
    fontWeight: "600",
  },
});