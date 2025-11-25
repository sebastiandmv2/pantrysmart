import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function RecipeImpactModal({ 
  visible, 
  onClose, 
  productName,
  quantity,
  unit,
  impactData,
  onConfirm,
  loading
}) {
  if (!visible || !impactData) return null;

  const { affectedRecipes = [], totalAffected = 0 } = impactData;

  const getImpactColor = (impact) => {
    switch (impact) {
      case "high": return "#10b981";
      case "medium": return "#f59e0b";
      case "low": return "#6b7280";
      default: return "#6b7280";
    }
  };

  const getImpactIcon = (impact) => {
    switch (impact) {
      case "high": return "trending-up";
      case "medium": return "trending-neutral";
      case "low": return "trending-down";
      default: return "minus";
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons name="chart-line" size={24} color="#059669" />
              <Text style={styles.title}>Impacto en recetas</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Product info */}
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{productName}</Text>
            <Text style={styles.productQuantity}>{quantity} {unit}</Text>
          </View>

          {/* Impact summary */}
          <View style={styles.impactSummary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{totalAffected}</Text>
              <Text style={styles.summaryLabel}>Recetas afectadas</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="arrow-up" size={16} color="#10b981" />
              <Text style={styles.summaryLabel}>Disponibilidad mejorada</Text>
            </View>
          </View>

          {/* Affected recipes list */}
          <ScrollView style={styles.recipesList} showsVerticalScrollIndicator={false}>
            {affectedRecipes.map((recipe, index) => (
              <View key={index} style={styles.recipeItem}>
                <View style={styles.recipeHeader}>
                  <Text style={styles.recipeName}>{recipe.name}</Text>
                  <View style={[
                    styles.impactBadge, 
                    { backgroundColor: `${getImpactColor(recipe.impact)}20` }
                  ]}>
                    <MaterialCommunityIcons 
                      name={getImpactIcon(recipe.impact)} 
                      size={12} 
                      color={getImpactColor(recipe.impact)} 
                    />
                    <Text style={[
                      styles.impactText, 
                      { color: getImpactColor(recipe.impact) }
                    ]}>
                      {recipe.impact}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.availabilityChange}>
                  <Text style={styles.availabilityBefore}>
                    {recipe.currentAvailability}%
                  </Text>
                  <MaterialCommunityIcons name="arrow-right" size={16} color="#6b7280" />
                  <Text style={styles.availabilityAfter}>
                    {recipe.newAvailability}%
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.confirmButton} 
              onPress={onConfirm}
              disabled={loading}
            >
              <MaterialCommunityIcons 
                name="package-variant-closed" 
                size={16} 
                color="#fff" 
              />
              <Text style={styles.confirmButtonText}>
                {loading ? "Agregando..." : "Agregar al inventario"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  closeButton: {
    padding: 4,
  },
  productInfo: {
    padding: 20,
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: 14,
    color: "#6b7280",
  },
  impactSummary: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#ecfdf5",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#059669",
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#a7f3d0",
    marginHorizontal: 16,
  },
  recipesList: {
    maxHeight: 200,
    padding: 16,
  },
  recipeItem: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  recipeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recipeName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  impactBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  impactText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  availabilityChange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  availabilityBefore: {
    fontSize: 12,
    color: "#ef4444",
    fontWeight: "600",
  },
  availabilityAfter: {
    fontSize: 12,
    color: "#10b981",
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  confirmButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#059669",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});