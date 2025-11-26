import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useShoppingList } from "../hooks/useShoppingList";
import { useRecipes } from "../hooks/useRecipes";
import { useInventoryRecipeSync } from "../hooks/useInventoryRecipeSync";
import InventoryIntegrationCard from "../components/InventoryIntegrationCard";
import ToastContainer from "../components/ToastContainer";
import SuccessAnimation from "../components/SuccessAnimation";
import { useToast } from "../hooks/useToast";

// Mock user ID - en una app real vendría del contexto de autenticación
const MOCK_USER_ID = "demo-user";

export default function ShoppingListScreen({ navigation }) {
  const [shoppingList, setShoppingList] = useState([]);
  const [summary, setSummary] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all"); // all, pending, purchased
  const [editingItem, setEditingItem] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  
  // Hook para notificaciones
  const { toasts, hideToast, showSuccess, showError, showInfo, showWarning } = useToast();

  // Hooks para manejar llamadas a la API
  const {
    loading,
    getShoppingList,
    getSummary,
    markItemAsPurchased,
    updateShoppingListItem,
    deleteShoppingListItem,
    addItemToInventory,
  } = useShoppingList();

  const { refreshRecipes } = useRecipes(MOCK_USER_ID);
  const { notifyRecipeAvailabilityChange, syncInventoryWithRecipes } = useInventoryRecipeSync();

  useEffect(() => {
    loadData();
  }, []);

  // Refrescar datos cuando la pantalla obtiene foco
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    await Promise.all([loadShoppingList(), loadSummary()]);
  };

  const loadShoppingList = async () => {
    try {
      const response = await getShoppingList(MOCK_USER_ID);
      setShoppingList(response || []);
    } catch (error) {
      console.error("Error loading shopping list:", error);
      // El error ya se maneja en el hook
    }
  };

  const loadSummary = async () => {
    try {
      const response = await getSummary(MOCK_USER_ID);
      setSummary(response);
    } catch (error) {
      console.error("Error loading summary:", error);
      // Fallback summary
      setSummary({
        total_items: 0,
        pending_items: 0,
        purchased_items: 0,
        estimated_total_cost: 0,
        items_by_category: {}
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getFilteredList = () => {
    if (filter === "pending") {
      return shoppingList.filter(item => item.status === "pending");
    } else if (filter === "purchased") {
      return shoppingList.filter(item => item.status === "purchased");
    }
    return shoppingList;
  };

  const handleMarkAsPurchased = async (item) => {
    Alert.alert(
      "Marcar como comprado",
      `¿Marcar "${item.product?.name}" como comprado?`,
      [
        {
          text: "Con precio",
          onPress: () => {
            setEditingItem(item);
            setPriceInput(item.estimated_price?.toString() || "");
            setEditModalVisible(true);
          }
        },
        {
          text: "Sin precio",
          onPress: () => markItemPurchased(item, null)
        },
        { text: "Cancelar", style: "cancel" }
      ]
    );
  };

  const markItemPurchased = async (item, actualPrice) => {
    try {
      showInfo("Marcando como comprado...", 1500);
      
      await markItemAsPurchased(item.id, actualPrice);
      
      setShowSuccessAnimation(true);
      showSuccess(`"${item.product?.name}" marcado como comprado`, 2000);
      
      // Preguntar si agregar al inventario
      setTimeout(() => {
        Alert.alert(
          "¡Comprado!",
          `¿Agregar "${item.product?.name}" a tu inventario?`,
          [
            {
              text: "Sí, agregar",
              onPress: () => addToInventory(item)
            },
            { text: "No", style: "cancel" }
          ]
        );
      }, 1000);
      
      // Recargar datos
      await loadData();
    } catch (error) {
      showError("Error marcando como comprado", 3000);
    }
  };

  const addToInventory = async (item) => {
    try {
      await addItemToInventory(MOCK_USER_ID, item.product_id, item.quantity_needed);
      Alert.alert(
        "¡Agregado!",
        `"${item.product?.name}" se agregó a tu inventario`,
        [{ text: "OK" }]
      );
    } catch (error) {
      // El error ya se maneja en el hook
    }
  };

  const handleAddToInventory = async (item) => {
    if (item.status !== "purchased") {
      Alert.alert(
        "Item no comprado",
        "Solo puedes agregar al inventario items que ya compraste",
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Agregar al inventario",
      `¿Agregar "${item.product?.name}" (${item.quantity_needed} ${item.unit}) a tu inventario?`,
      [
        {
          text: "Sí, agregar",
          onPress: async () => {
            try {
              // Agregar al inventario
              await addItemToInventory(MOCK_USER_ID, item.product_id, item.quantity_needed);
              
              // Notificar cambio de disponibilidad de recetas
              try {
                await notifyRecipeAvailabilityChange(
                  item.product?.name, 
                  item.quantity_needed, 
                  MOCK_USER_ID
                );
              } catch (syncError) {
                console.warn("Error syncing recipe availability:", syncError);
              }
              
              Alert.alert(
                "¡Agregado al inventario!",
                `"${item.product?.name}" se agregó a tu inventario.\n\n📊 La disponibilidad de tus recetas se actualizó automáticamente.`,
                [
                  {
                    text: "Ver inventario",
                    onPress: () => navigation.navigate("Inventory")
                  },
                  {
                    text: "Ver recetas",
                    onPress: () => navigation.navigate("Recipes")
                  },
                  { text: "Continuar", style: "cancel" }
                ]
              );
              
              // Recargar datos para reflejar cambios
              await loadData();
              
              // Actualizar cache de recetas en background
              try {
                await refreshRecipes();
              } catch (refreshError) {
                console.warn("Error refreshing recipes:", refreshError);
              }
              
            } catch (error) {
              // El error ya se maneja en el hook
            }
          }
        },
        { text: "Cancelar", style: "cancel" }
      ]
    );
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setPriceInput(item.estimated_price?.toString() || "");
    setEditModalVisible(true);
  };

  const handleDeleteItem = (item) => {
    Alert.alert(
      "Eliminar item",
      `¿Eliminar "${item.product?.name}" de la lista?`,
      [
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteShoppingListItem(item.id);
              await loadData();
            } catch (error) {
              // El error ya se maneja en el hook
            }
          }
        },
        { text: "Cancelar", style: "cancel" }
      ]
    );
  };

  const saveItemEdit = async () => {
    if (!editingItem) return;

    try {
      const updateData = {};
      
      if (priceInput) {
        const price = parseFloat(priceInput);
        if (!isNaN(price) && price > 0) {
          updateData.estimated_price = price;
        }
      }

      if (Object.keys(updateData).length > 0) {
        await updateShoppingListItem(editingItem.id, updateData);
      }

      // Si hay precio y el item está pendiente, marcar como comprado
      if (priceInput && editingItem.status === "pending") {
        await markItemPurchased(editingItem, parseFloat(priceInput));
      }

      setEditModalVisible(false);
      setEditingItem(null);
      setPriceInput("");
      
      await loadData();
    } catch (error) {
      // El error ya se maneja en el hook
    }
  };

  const renderShoppingItem = ({ item }) => {
    return (
      <View style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.product?.name}</Text>
            <Text style={styles.itemQuantity}>
              {item.quantity_needed} {item.unit}
            </Text>
            {item.added_from_recipe_name && (
              <Text style={styles.recipeTag}>
                De receta: {item.added_from_recipe_name}
              </Text>
            )}
            {item.status === "purchased" && item.purchased_date && (
              <Text style={styles.purchasedDate}>
                Comprado: {new Date(item.purchased_date).toLocaleDateString()}
              </Text>
            )}
          </View>
          <View style={styles.itemActions}>
            {item.status === "pending" ? (
              <>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditItem(item)}
                >
                  <MaterialCommunityIcons name="pencil" size={16} color="#6b7280" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteItem(item)}
                >
                  <MaterialCommunityIcons name="trash-can" size={16} color="#ef4444" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pendingButton}
                  onPress={() => handleMarkAsPurchased(item)}
                >
                  <MaterialCommunityIcons name="cart-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.purchasedActions}>
                <TouchableOpacity
                  style={styles.inventoryButton}
                  onPress={() => handleAddToInventory(item)}
                >
                  <MaterialCommunityIcons name="package-variant-closed" size={16} color="#059669" />
                </TouchableOpacity>
                <View style={styles.purchasedButton}>
                  <MaterialCommunityIcons name="check" size={20} color="#fff" />
                </View>
              </View>
            )}
          </View>
        </View>
        
        {item.notes && (
          <Text style={styles.itemNotes}>{item.notes}</Text>
        )}
        
        <View style={styles.priceRow}>
          {item.estimated_price && (
            <Text style={styles.itemPrice}>
              Estimado: ${item.estimated_price.toLocaleString()}
            </Text>
          )}
          {item.actual_price && (
            <Text style={styles.actualPrice}>
              Pagado: ${item.actual_price.toLocaleString()}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const getCategoryColor = (category) => {
    const colors = {
      "Verduras": "#10b981",
      "Frutas": "#f59e0b",
      "Carnes": "#ef4444",
      "Lácteos": "#3b82f6",
      "Abarrotes": "#8b5cf6",
    };
    return colors[category] || "#6b7280";
  };

  if (loading && shoppingList.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Cargando lista de compras...</Text>
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
        <Text style={styles.title}>Lista de Compras</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate("Recipes")}
        >
          <MaterialCommunityIcons name="robot" size={24} color="#059669" />
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === "all" && styles.filterButtonActive]}
          onPress={() => setFilter("all")}
        >
          <Text style={[styles.filterButtonText, filter === "all" && styles.filterButtonTextActive]}>
            Todos ({shoppingList.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === "pending" && styles.filterButtonActive]}
          onPress={() => setFilter("pending")}
        >
          <Text style={[styles.filterButtonText, filter === "pending" && styles.filterButtonTextActive]}>
            Pendientes ({summary?.pending_items || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === "purchased" && styles.filterButtonActive]}
          onPress={() => setFilter("purchased")}
        >
          <Text style={[styles.filterButtonText, filter === "purchased" && styles.filterButtonTextActive]}>
            Comprados ({summary?.purchased_items || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Resumen */}
      {summary && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{summary.pending_items}</Text>
              <Text style={styles.summaryLabel}>Pendientes</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{summary.purchased_items}</Text>
              <Text style={styles.summaryLabel}>Comprados</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>
                ${summary.estimated_total_cost?.toLocaleString() || 0}
              </Text>
              <Text style={styles.summaryLabel}>Estimado</Text>
            </View>
          </View>

          {/* Categorías */}
          {Object.keys(summary.items_by_category || {}).length > 0 && (
            <View style={styles.categoriesContainer}>
              <Text style={styles.categoriesTitle}>Por categoría:</Text>
              <View style={styles.categoriesRow}>
                {Object.entries(summary.items_by_category).map(([category, count]) => (
                  <View 
                    key={category} 
                    style={[
                      styles.categoryTag, 
                      { backgroundColor: `${getCategoryColor(category)}20` }
                    ]}
                  >
                    <Text style={[styles.categoryText, { color: getCategoryColor(category) }]}>
                      {category}: {count}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Card de integración con inventario */}
      <InventoryIntegrationCard
        purchasedItems={shoppingList.filter(item => item.status === "purchased")}
        onViewInventory={() => navigation.navigate("Inventory")}
        onViewRecipes={() => navigation.navigate("Recipes")}
        onRefreshRecipes={async () => {
        try {
          await syncInventoryWithRecipes(MOCK_USER_ID);
          await refreshRecipes();
          Alert.alert(
            "✅ Recetas actualizadas",
            "La disponibilidad de todas las recetas se actualizó basada en tu inventario actual",
            [{ text: "OK" }]
          );
        } catch (error) {
          Alert.alert("Error", "No se pudieron actualizar las recetas");
        }
      }}
      />

      {/* Lista */}
      <FlatList
        data={getFilteredList()}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderShoppingItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#059669"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name={filter === "purchased" ? "check-circle" : "cart-outline"} 
              size={64} 
              color="#9ca3af" 
            />
            <Text style={styles.emptyTitle}>
              {filter === "purchased" ? "No hay compras" : filter === "pending" ? "No hay pendientes" : "Lista vacía"}
            </Text>
            <Text style={styles.emptyText}>
              {filter === "purchased" 
                ? "Aún no has comprado ningún item"
                : filter === "pending" 
                ? "No tienes items pendientes por comprar"
                : "Agrega ingredientes faltantes desde las recetas con IA"
              }
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => navigation.navigate("Recipes")}
            >
              <MaterialCommunityIcons name="robot" size={16} color="#fff" />
              <Text style={styles.emptyButtonText}>Generar recetas IA</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={getFilteredList().length === 0 ? styles.emptyList : styles.listContainer}
      />

      {/* Modal de edición */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem?.status === "pending" ? "Marcar como comprado" : "Editar item"}
              </Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.modalItemName}>{editingItem?.product?.name}</Text>
              <Text style={styles.modalItemQuantity}>
                {editingItem?.quantity_needed} {editingItem?.unit}
              </Text>

              <View style={styles.priceInputContainer}>
                <Text style={styles.priceInputLabel}>Precio pagado (opcional)</Text>
                <TextInput
                  style={styles.priceInput}
                  value={priceInput}
                  onChangeText={setPriceInput}
                  placeholder="Ej: 1500"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={saveItemEdit}
              >
                <Text style={styles.modalSaveButtonText}>
                  {editingItem?.status === "pending" ? "Marcar comprado" : "Guardar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Animación de éxito */}
      <SuccessAnimation
        visible={showSuccessAnimation}
        onComplete={() => setShowSuccessAnimation(false)}
        icon="check-circle"
        color="#10b981"
        size={72}
      />

      {/* Toasts de notificación */}
      <ToastContainer 
        toasts={toasts}
        onHideToast={hideToast}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
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
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  summaryCard: {
    backgroundColor: "#f9fafb",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#059669",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  categoriesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  categoriesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  categoriesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "500",
  },
  listContainer: {
    paddingBottom: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: "#059669",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },
  filtersContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f3f4f6",
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#fef2f2",
  },
  purchasedDate: {
    fontSize: 11,
    color: "#10b981",
    fontWeight: "500",
    marginTop: 2,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  actualPrice: {
    fontSize: 12,
    color: "#10b981",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
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
    color: "#1f2937",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  modalItemQuantity: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
  },
  priceInputContainer: {
    marginBottom: 20,
  },
  priceInputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#059669",
    alignItems: "center",
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  itemCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  recipeTag: {
    fontSize: 12,
    color: "#059669",
    fontStyle: "italic",
  },
  itemActions: {
    marginLeft: 12,
  },
  statusButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  pendingButton: {
    backgroundColor: "#f59e0b",
  },
  purchasedButton: {
    backgroundColor: "#10b981",
  },
  itemNotes: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 8,
    fontStyle: "italic",
  },
  itemPrice: {
    fontSize: 12,
    color: "#374151",
    marginTop: 4,
    fontWeight: "500",
  },
  purchasedActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inventoryButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
});