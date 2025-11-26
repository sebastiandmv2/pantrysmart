// pantrysmart_app/mobile/src/screens/AIRecipeDetailScreen.js

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import AddToListModal from "../components/AddToListModal";
import { addItemsToList } from "../services/userLists";
import { useAIRecipes } from "../hooks/useAIRecipes";

const MOCK_USER_ID = "demo-user";

export default function AIRecipeDetailScreen({ route, navigation }) {
  const { recipe, generationTime, userInventoryItems } = route.params || {};

  const { saveGeneratedRecipe } = useAIRecipes();  // 👈 nuevo

  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [addingToList, setAddingToList] = useState(false);
  // Para marcar manualmente ingredientes como “ya los tengo”
  const [temporaryAvailable, setTemporaryAvailable] = useState(new Set());

  // Si por alguna razón llegamos sin receta
  if (!recipe) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se pudo cargar la receta</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const baseMissing = recipe.missing_ingredients || [];
  const missingSet = new Set(baseMissing);

  const isIngredientAvailable = (name) => {
    const isMissingFromBackend = missingSet.has(name);
    const isTempAvailable = temporaryAvailable.has(name);
    // Si IA dice que falta pero el usuario lo marca como disponible → disponible
    return !isMissingFromBackend || isTempAvailable;
  };

  const toggleTemporaryAvailable = (name) => {
    setTemporaryAvailable((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "facil":
        return "#10b981";
      case "intermedio":
        return "#f59e0b";
      case "dificil":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getDifficultyText = (difficulty) => {
    switch (difficulty) {
      case "facil":
        return "Fácil";
      case "intermedio":
        return "Intermedio";
      case "dificil":
        return "Difícil";
      default:
        return difficulty;
    }
  };

  const computeAvailability = () => {
    const allIngredients = recipe.ingredients || [];
    const nonOptional = allIngredients.filter((ing) => !ing.is_optional);

    if (!nonOptional.length) {
      return { percentage: 100, canMake: true };
    }

    let availableCount = 0;
    for (const ing of nonOptional) {
      if (isIngredientAvailable(ing.name)) {
        availableCount++;
      }
    }

    const percentage = Math.round(
      (availableCount / nonOptional.length) * 100
    );
    const canMake = availableCount === nonOptional.length;

    return { percentage, canMake };
  };

  const availabilityInfo = computeAvailability();
  const difficultyColor = getDifficultyColor(recipe.difficulty);
  const tags = recipe.tags ? recipe.tags.split(",") : [];

  const allIngredients = recipe.ingredients || [];
  const availableIngredients = allIngredients.filter((ing) =>
    isIngredientAvailable(ing.name)
  );
  const missingIngredients = allIngredients.filter(
    (ing) => !isIngredientAvailable(ing.name)
  );

  // Agregar faltantes a lista de compras (User Lists)
  const handleConfirmAddToList = async ({ listId }) => {
    try {
      const missing = baseMissing;

      if (!missing || !missing.length) {
        Alert.alert(
          "Sin ingredientes",
          "No hay ingredientes faltantes para agregar."
        );
        return;
      }

      setAddingToList(true);

      const itemsToAdd = (recipe.ingredients || [])
        .filter((ing) => missing.includes(ing.name))
        .map((ing) => ({
          name: ing.name,
          quantity: ing.quantity ?? null,
          unit: ing.unit ?? null,
          fromAI: true,
          fromRecipeName: recipe.name,
        }));

      if (!itemsToAdd.length) {
        Alert.alert(
          "Sin ingredientes",
          "No se encontraron ingredientes coincidentes para agregar."
        );
        return;
      }

      await addItemsToList(listId, itemsToAdd);

      // Guardar receta generada en el backend de forma silenciosa
      try {
        await saveGeneratedRecipe({
          user_id: MOCK_USER_ID,
          recipe,
        });
      } catch (saveErr) {
        console.warn(
          "Error auto-guardando receta IA al agregar faltantes (detalle):",
          saveErr
        );
      }

      setShowAddToListModal(false);

      Alert.alert(
        "Añadido a lista",
        `Se agregaron ${itemsToAdd.length} ${
          mode === "missing"
            ? "ingredientes faltantes"
            : "ingredientes"
        } a tu lista.`
      );

      setShowAddToListModal(false);

      Alert.alert(
        "📝 Agregado a lista",
        `${itemsToAdd.length} ingredientes agregados a tu lista de compras`,
        [
          {
            text: "Ver lista",
            onPress: () => navigation.navigate("ShoppingList"),
          },
          { text: "Continuar", style: "cancel" },
        ]
      );
    } catch (error) {
      console.error("Error adding AI ingredients to list:", error);
      Alert.alert(
        "Error",
        "No se pudieron agregar los ingredientes a la lista."
      );
    } finally {
      setAddingToList(false);
    }
  };

  const totalTime =
    (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>{recipe.name}</Text>

        {recipe.description && (
          <Text style={styles.description}>{recipe.description}</Text>
        )}

        <View className="metaInfo" style={styles.metaInfo}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Tiempo</Text>
            <Text style={styles.metaValue}>{totalTime} min</Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Porciones</Text>
            <Text style={styles.metaValue}>{recipe.servings}</Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Dificultad</Text>
            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: `${difficultyColor}20` },
              ]}
            >
              <Text
                style={[
                  styles.difficultyText,
                  { color: difficultyColor },
                ]}
              >
                {getDifficultyText(recipe.difficulty)}
              </Text>
            </View>
          </View>
        </View>

        {/* Tags */}
        {tags.length > 0 && (
          <View style={styles.tags}>
            {tags.map((tag, idx) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>{tag.trim()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Disponibilidad */}
        <View style={styles.availabilitySection}>
          <Text style={styles.sectionTitle}>
            Disponibilidad: {availabilityInfo.percentage}%
          </Text>
          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${availabilityInfo.percentage}%`,
                  backgroundColor:
                    availabilityInfo.percentage >= 80
                      ? "#10b981"
                      : availabilityInfo.percentage >= 50
                      ? "#f59e0b"
                      : "#ef4444",
                },
              ]}
            />
          </View>
          <Text
            style={[
              styles.canMakeText,
              {
                color: availabilityInfo.canMake
                  ? "#10b981"
                  : "#ef4444",
              },
            ]}
          >
            {availabilityInfo.canMake
              ? "✓ Puedes hacer esta receta"
              : "✗ Te faltan ingredientes"}
          </Text>

          {typeof generationTime === "number" && (
            <Text
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              Generada en {generationTime}s usando{" "}
              {userInventoryItems ?? 0} ítems de tu inventario
            </Text>
          )}
        </View>
      </View>

      {/* INGREDIENTES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Ingredientes ({allIngredients.length})
        </Text>

        {availableIngredients.length > 0 && (
          <View style={styles.ingredientGroup}>
            <Text style={styles.ingredientGroupTitle}>
              ✓ Disponibles ({availableIngredients.length})
            </Text>
            {availableIngredients.map((ing, idx) => (
              <View key={`avail-${idx}`} style={styles.ingredientItem}>
                <Text style={styles.ingredientName}>
                  {ing.name}
                  {ing.is_optional && (
                    <Text style={styles.optionalText}> (opcional)</Text>
                  )}
                </Text>
                <Text style={styles.ingredientQuantity}>
                  {ing.quantity} {ing.unit || "unidades"}
                </Text>
              </View>
            ))}
          </View>
        )}

        {missingIngredients.length > 0 && (
          <View style={styles.ingredientGroup}>
            <Text style={styles.ingredientGroupTitle}>
              ✗ Faltantes ({missingIngredients.length})
            </Text>
            {missingIngredients.map((ing, idx) => {
              const isTemp = temporaryAvailable.has(ing.name);

              return (
                <View key={`missing-${idx}`} style={styles.ingredientItem}>
                  <Text style={styles.ingredientName}>
                    {ing.name}
                    {ing.is_optional && (
                      <Text style={styles.optionalText}> (opcional)</Text>
                    )}
                    {isTemp && (
                      <Text style={styles.temporaryText}>
                        {" "}
                        (marcado)
                      </Text>
                    )}
                  </Text>
                  <Text style={styles.ingredientQuantity}>
                    {ing.quantity} {ing.unit || "unidades"}
                  </Text>

                  {!ing.is_optional && (
                    <View style={styles.ingredientActions}>
                      <TouchableOpacity
                        style={[
                          styles.temporaryButton,
                          isTemp && styles.temporaryButtonActive,
                        ]}
                        onPress={() => toggleTemporaryAvailable(ing.name)}
                      >
                        <Text
                          style={[
                            styles.temporaryButtonText,
                            isTemp && styles.temporaryButtonTextActive,
                          ]}
                        >
                          {isTemp
                            ? "✓ Ya lo tengo"
                            : "✓ Marcar como disponible"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* INSTRUCCIONES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instrucciones</Text>
        <Text style={styles.instructions}>{recipe.instructions}</Text>
      </View>

      {/* ACCIONES */}
      <View style={styles.actionSection}>
        {baseMissing.length > 0 && (
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryActionButton]}
            onPress={() => setShowAddToListModal(true)}
            disabled={addingToList}
          >
            {addingToList ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : (
              <Text style={styles.secondaryActionButtonText}>
                Agregar faltantes a lista de compras
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* MODAL PARA ELEGIR LISTA */}
      <AddToListModal
        visible={showAddToListModal}
        onClose={() => setShowAddToListModal(false)}
        hasMissing={baseMissing.length > 0}
        allowAllOption={false} // sólo faltantes
        onConfirm={handleConfirmAddToList}
      />
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#059669",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#6b7280",
    lineHeight: 24,
    marginBottom: 16,
  },
  metaInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  metaItem: {
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: "600",
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
    gap: 8,
  },
  tag: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
  availabilitySection: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
  },
  progressBackground: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    marginVertical: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  canMakeText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  ingredientGroup: {
    marginBottom: 20,
  },
  ingredientGroupTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  ingredientItem: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  optionalText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#6b7280",
    fontStyle: "italic",
  },
  ingredientQuantity: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
  },
  instructions: {
    fontSize: 16,
    lineHeight: 24,
    color: "#374151",
  },
  actionSection: {
    padding: 20,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryActionButton: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  secondaryActionButtonText: {
    color: "#059669",
    fontSize: 16,
    fontWeight: "600",
  },
  // estilos para marcar ingredientes manualmente
  temporaryText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#8b5cf6",
    fontStyle: "italic",
  },
  ingredientActions: {
    marginTop: 8,
  },
  temporaryButton: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  temporaryButtonActive: {
    backgroundColor: "#ede9fe",
    borderColor: "#8b5cf6",
  },
  temporaryButtonText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
    textAlign: "center",
  },
  temporaryButtonTextActive: {
    color: "#8b5cf6",
    fontWeight: "600",
  },
});
