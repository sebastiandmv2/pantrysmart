import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function InventoryIntegrationCard({ 
  purchasedItems,
  onViewInventory,
  onViewRecipes,
  onRefreshRecipes
}) {
  const [refreshingRecipes, setRefreshingRecipes] = useState(false);

  const purchasedCount = purchasedItems?.length || 0;
  const canAddToInventory = purchasedItems?.filter(item => item.status === "purchased").length || 0;

  const handleRefreshRecipes = async () => {
    if (onRefreshRecipes) {
      setRefreshingRecipes(true);
      try {
        await onRefreshRecipes();
      } catch (error) {
        console.error("Error refreshing recipes:", error);
      } finally {
        setRefreshingRecipes(false);
      }
    }
  };

  if (purchasedCount === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="link-variant" size={20} color="#059669" />
        <Text style={styles.title}>Integración con inventario</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{canAddToInventory}</Text>
            <Text style={styles.statLabel}>Items comprados</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <MaterialCommunityIcons name="arrow-right" size={16} color="#6b7280" />
            <Text style={styles.statLabel}>Agregar a inventario</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <MaterialCommunityIcons name="refresh" size={16} color="#8b5cf6" />
            <Text style={styles.statLabel}>Actualizar recetas</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onViewInventory}
          >
            <MaterialCommunityIcons name="package-variant" size={16} color="#059669" />
            <Text style={styles.actionButtonText}>Ver inventario</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.recipesButton]}
            onPress={handleRefreshRecipes}
            disabled={refreshingRecipes}
          >
            {refreshingRecipes ? (
              <ActivityIndicator size="small" color="#8b5cf6" />
            ) : (
              <MaterialCommunityIcons name="book-refresh" size={16} color="#8b5cf6" />
            )}
            <Text style={[styles.actionButtonText, styles.recipesButtonText]}>
              {refreshingRecipes ? "Actualizando..." : "Actualizar recetas"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="information" size={14} color="#6b7280" />
          <Text style={styles.infoText}>
            Agregar items al inventario actualiza la disponibilidad de recetas automáticamente
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f9fafb",
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#a7f3d0",
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
  },
  content: {
    padding: 16,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  stat: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#059669",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 12,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  recipesButton: {
    backgroundColor: "#f3f4f6",
    borderColor: "#e5e7eb",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
  },
  recipesButtonText: {
    color: "#8b5cf6",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: "#6b7280",
    lineHeight: 14,
  },
});