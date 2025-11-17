import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useHealthCheck } from "../hooks/useApi";
import { useInventory } from "../hooks/useInventory";
import { useFocusEffect } from "@react-navigation/native";

// Mapeo de iconos por categoría (fallback para categorías sin icono específico)
const CATEGORY_ICON_MAP = {
  "Abarrotes": "package-variant-closed",
  "Lácteos": "bottle-soda", 
  "Carnes": "food-drumstick",
  "Embutidos": "sausage",
  "Panadería": "bread-slice",
  "Verduras": "sprout",
  "Frutas": "apple",
  "Congelados": "snowflake",
  "Dulces": "candy",
  "Snacks": "popcorn",
  "Condimentos": "shaker-outline",
  "Bebestibles": "cup-water",
  "Limpieza": "spray-bottle",
  "Cuidado Personal": "face-woman",
  "Mascotas": "dog",
  "Hogar": "home-variant"
};

export default function HomeScreen({ navigation }) {
  const { data: healthData, loading: healthLoading, error: healthError } = useHealthCheck();
  const {
    loading: inventoryLoading,
    error: inventoryError,
    summary,
    categories,
    refresh
  } = useInventory();
  
  const [refreshing, setRefreshing] = useState(false);

  // Refrescar datos cuando la pantalla obtiene foco
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Obtener conteo total de productos
  const totalProducts = summary?.total_products || 0;

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: 28 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#2f7d36"]}
          tintColor="#2f7d36"
        />
      }
    >
      {/* Estado de conexión con API */}
      <View style={styles.connectionStatus}>
        <MaterialCommunityIcons 
          name={healthError ? "wifi-off" : "wifi"} 
          size={16} 
          color={healthError ? "#dc2626" : "#059669"} 
        />
        <Text style={[styles.connectionText, { color: healthError ? "#dc2626" : "#059669" }]}>
          {healthLoading ? "Conectando..." : healthError ? "Sin conexión" : "Conectado a API"}
        </Text>
      </View>

      {/* Encabezado */}
      <Text style={styles.greeting}>Hola, Usuario 👋</Text>
      {inventoryLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2f7d36" />
          <Text style={styles.loadingText}>Cargando inventario...</Text>
        </View>
      ) : (
        <Text style={styles.subtitle}>
          Tienes {totalProducts} producto{totalProducts !== 1 ? 's' : ''} en tu despensa
        </Text>
      )}

      {/* Acciones */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionPrimary]}
          onPress={() => navigation.navigate("Scan")}
        >
          <MaterialCommunityIcons
            name="camera"
            size={18}
            color="#fff"
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.actionText, { color: "#fff" }]}>Escanear boleta</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => navigation.navigate("AddProduct")}
        >
          <MaterialCommunityIcons
            name="plus"
            size={18}
            color="#111"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.actionText}>Añadir producto</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => navigation.navigate("Inventory")}
        >
          <MaterialCommunityIcons
            name="package-variant"
            size={18}
            color="#111"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.actionText}>Inventario</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("Receipts")}
        >
          <MaterialCommunityIcons
            name="receipt"
            size={18}
            color="#111"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.actionText}>Mis boletas</Text>
        </TouchableOpacity>
      </View>





      {/* ======  Inventario ====== */}
      <Section 
        title="Inventario"
        action={
          <TouchableOpacity 
            style={styles.sectionAction}
            onPress={() => navigation.navigate("Inventory")}
          >
            <Text style={styles.sectionActionText}>Ver todo</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#2f7d36" />
          </TouchableOpacity>
        }
      >
        {/* Cuadro de total productos */}
        <View style={styles.totalProductsCard}>
          <MaterialCommunityIcons name="package-variant" size={24} color="#2f7d36" />
          <Text style={styles.totalProductsNumber}>{totalProducts}</Text>
          <Text style={styles.totalProductsLabel}>Productos únicos</Text>
        </View>
        {inventoryLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2f7d36" />
            <Text style={styles.loadingText}>Cargando categorías...</Text>
          </View>
        ) : categories.length > 0 ? (
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity 
                key={category.id} 
                style={styles.catCard}
                onPress={() => {
                  // Navegar al inventario con la categoría seleccionada
                  navigation.navigate("Inventory", { selectedCategory: category.name });
                }}
              >
                <View style={[styles.catIconWrap, { backgroundColor: category.color + '20' }]}>
                  <MaterialCommunityIcons 
                    name={category.icon || CATEGORY_ICON_MAP[category.name] || "package-variant"} 
                    size={18} 
                    color={category.color || "#2f7d36"} 
                  />
                </View>
                <View>
                  <Text style={styles.catName}>{category.name}</Text>
                  <Text style={styles.catCount}>{category.count} producto{category.count !== 1 ? 's' : ''}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="package-variant" size={32} color="#9ca3af" />
            <Text style={styles.emptyText}>No hay productos en el inventario</Text>
            <TouchableOpacity 
              style={styles.addFirstProductBtn}
              onPress={() => navigation.navigate("Scan")}
            >
              <Text style={styles.addFirstProductText}>Escanear primera boleta</Text>
            </TouchableOpacity>
        </View>
        )}
      </Section>


    </ScrollView>
  );
}

/* =============== Componentes UI locales =============== */

function Section({ title, subtitle, badge, action, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
        {action ? action : null}
      </View>
      {children}
    </View>
  );
}



/* ===================== Estilos ===================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },

  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  connectionText: {
    fontSize: 12,
    fontWeight: "600",
  },

  greeting: { fontSize: 22, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#555", marginBottom: 16 },

  actionsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  actionBtn: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
    flexDirection: "row",
  },
  actionPrimary: { backgroundColor: "#2f7d36" },
  actionText: { color: "#000", fontWeight: "600", fontSize: 14 },



  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
    marginTop: 16,
  },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  sectionSubtitle: { color: "#6b7280", marginTop: 2 },

  badge: {
    backgroundColor: "#e5f5eb",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#b7e4ca",
  },
  badgeText: { color: "#2f7d36", fontWeight: "700", fontSize: 12 },



  categoriesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  catCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    minWidth: "47%",
  },
  catIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#eaf7ee",
    alignItems: "center",
    justifyContent: "center",
  },
  catName: { fontWeight: "700" },
  catCount: { color: "#6b7280", fontSize: 12 },



  // Nuevos estilos para estados de carga y vacío
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#6b7280",
    fontStyle: "italic",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  addFirstProductBtn: {
    backgroundColor: "#2f7d36",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  addFirstProductText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  sectionAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#ecfdf5",
  },
  sectionActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2f7d36",
  },
  totalProductsCard: {
    backgroundColor: "#f8fffe",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  totalProductsNumber: {
    fontSize: 32,
    fontWeight: "700",
    color: "#2f7d36",
    marginVertical: 4,
  },
  totalProductsLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
  },
});
