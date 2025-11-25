import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { apiService } from "../services/apiService";
import { useRecipeDetail } from "../hooks/useRecipes";
import AddToListModal from "../components/AddToListModal";
import { addItemsToList } from "../services/userLists";

const MOCK_USER_ID = "demo-user";

const RECIPE_IMAGES = {
  "empanadas-pino.jpg": require("../../assets/recipes/empanadas-pino.jpg"),
  "pastel-choclo.jpeg": require("../../assets/recipes/pastel-choclo.jpeg"),
  "cazuela-pollo.jpg": require("../../assets/recipes/cazuela-pollo.jpg"),
  "completo-italiano.jpg": require("../../assets/recipes/completo-italiano.jpg"),
  "porotos-rienda.jpg": require("../../assets/recipes/porotos-rienda.jpg"),
  "arroz-pollo.jpg": require("../../assets/recipes/arroz-pollo.jpg"),
  "charquican.jpg": require("../../assets/recipes/charquican.jpg"),
  "sopaipillas.jpg": require("../../assets/recipes/sopaipillas.jpg"),
  "lomo-pobre.jpg": require("../../assets/recipes/lomo-pobre.jpg"),
  "pan-amasado.jpeg": require("../../assets/recipes/pan-amasado.jpeg"),
};

export default function RecipeDetailScreen({ route, navigation }) {
  const { recipeId, recipeName } = route.params;
  const { recipe, loading, error, loadRecipeDetail } = useRecipeDetail();
  const [temporaryAvailable, setTemporaryAvailable] = useState(new Set());

  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [addingToList, setAddingToList] = useState(false);

  // 👇 nuevo estado para eliminar
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (recipeId) {
      loadRecipeDetail(recipeId, MOCK_USER_ID);
    }
  }, [recipeId, loadRecipeDetail]);

  useEffect(() => {
    if (error) {
      Alert.alert("Error", error);
    }
  }, [error]);

  useEffect(() => {
    if (recipeName) {
      navigation.setOptions({
        title: recipeName,
      });
    }
  }, [recipeName, navigation]);

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

  const formatTime = (prepTime, cookTime) => {
    const total = prepTime + (cookTime || 0);
    return `${total} min`;
  };

  const toggleTemporaryAvailable = (ingredientId) => {
    setTemporaryAvailable((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(ingredientId)) {
        newSet.delete(ingredientId);
      } else {
        newSet.add(ingredientId);
      }
      return newSet;
    });
  };

  const isIngredientAvailable = (ingredient) => {
    return ingredient.has_enough || temporaryAvailable.has(ingredient.id);
  };

  const getUpdatedAvailability = () => {
    if (!recipe) return { percentage: 0, canMake: false };

    const allIngredients = [
      ...recipe.available_ingredients,
      ...recipe.missing_ingredients,
    ];
    const nonOptionalIngredients = allIngredients.filter(
      (ing) => !ing.is_optional
    );

    if (nonOptionalIngredients.length === 0)
      return { percentage: 100, canMake: true };

    const availableCount = nonOptionalIngredients.filter((ing) =>
      isIngredientAvailable(ing)
    ).length;
    const percentage = (availableCount / nonOptionalIngredients.length) * 100;
    const canMake = availableCount === nonOptionalIngredients.length;

    return { percentage: Math.round(percentage), canMake };
  };

  const startCooking = async () => {
    try {
      const allIngredients = [
        ...recipe.available_ingredients,
        ...recipe.missing_ingredients,
      ];
      const ingredientsToConsume = allIngredients.filter(
        (ing) => !ing.is_optional && isIngredientAvailable(ing)
      );

      Alert.alert(
        "🍳 Comenzar a cocinar",
        `Esto consumirá los siguientes ingredientes de tu inventario:\n\n${ingredientsToConsume
          .map(
            (ing) =>
              `• ${ing.product.name}: ${ing.quantity_needed} unidades`
          )
          .join(
            "\n"
          )}\n\n¿Continuar?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "¡Sí, cocinar!",
            onPress: async () => {
              await consumeIngredients(ingredientsToConsume);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "No se pudo iniciar la cocina");
    }
  };

  const consumeIngredients = async (ingredients) => {
    try {
      let consumedCount = 0;
      let errors = [];

      for (const ingredient of ingredients) {
        try {
          if (ingredient.has_enough) {
            const inventoryItems = await apiService.inventory.getItems(
              MOCK_USER_ID
            );
            const inventoryItem = inventoryItems.find(
              (item) => item.product?.name === ingredient.product.name
            );

            if (inventoryItem) {
              await apiService.inventory.consumeItem(
                inventoryItem.id,
                ingredient.quantity_needed,
                `Usado en receta: ${recipe.name}`
              );
              consumedCount++;
            }
          }
        } catch (error) {
          console.error(
            `Error consuming ${ingredient.product.name}:`,
            error
          );
          errors.push(ingredient.product.name);
        }
      }

      if (errors.length === 0) {
        Alert.alert(
          "🎉 ¡Receta completada!",
          `Se consumieron ${consumedCount} ingredientes de tu inventario.\n\n¡Que disfrutes tu ${recipe.name}!`,
          [
            {
              text: "¡Genial!",
              onPress: () => {
                setTemporaryAvailable(new Set());
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "⚠️ Parcialmente completado",
          `Se consumieron ${consumedCount} ingredientes.\n\nNo se pudieron consumir: ${errors.join(
            ", "
          )}\n\n¡Aún puedes disfrutar tu ${recipe.name}!`,
          [
            {
              text: "Entendido",
              onPress: () => {
                setTemporaryAvailable(new Set());
                navigation.goBack();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error in consumeIngredients:", error);
      Alert.alert(
        "Error",
        "Hubo un problema consumiendo los ingredientes"
      );
    }
  };

  const handleConfirmAddToList = async ({ listId, mode }) => {
    if (!recipe) return;

    try {
      setAddingToList(true);

      const allIngredients = [
        ...(recipe.available_ingredients || []),
        ...(recipe.missing_ingredients || []),
      ];

      let source;
      if (mode === "missing") {
        source = recipe.missing_ingredients || [];
      } else {
        source = allIngredients;
      }

      if (!source.length) {
        Alert.alert(
          "Sin ingredientes",
          "No hay ingredientes para agregar a la lista."
        );
        return;
      }

      const itemsToAdd = source.map((ing) => ({
        name: ing.product?.name || "Ingrediente",
        quantity: ing.quantity_needed ?? null,
        unit: null,
        fromRecipeName: recipe.name,
        fromAI: false,
      }));

      await addItemsToList(listId, itemsToAdd);

      setShowAddToListModal(false);

      Alert.alert(
        "Añadido a lista",
        `Se agregaron ${itemsToAdd.length} ${
          mode === "missing"
            ? "ingredientes faltantes"
            : "ingredientes"
        } a tu lista.`
      );
    } catch (error) {
      console.error("Error adding ingredients to list:", error);
      Alert.alert(
        "Error",
        "No se pudieron agregar los ingredientes a la lista."
      );
    } finally {
      setAddingToList(false);
    }
  };

  // 👉 NUEVO: confirmar y eliminar receta
  const confirmDeleteRecipe = () => {
    if (!recipe) return;

    Alert.alert(
      "Eliminar receta",
      `¿Seguro que quieres eliminar "${recipe.name}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: deleteRecipe,
        },
      ]
    );
  };

  const deleteRecipe = async () => {
    if (!recipe?.id) {
      Alert.alert("Error", "No se encontró el ID de la receta.");
      return;
    }

    try {
      setDeleting(true);
      await apiService.recipes.deleteRecipe(recipe.id);

      Alert.alert(
        "Receta eliminada",
        `"${recipe.name}" fue eliminada correctamente.`,
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error("Error deleting recipe:", error);
      Alert.alert(
        "Error",
        "No se pudo eliminar la receta. Intenta nuevamente."
      );
    } finally {
      setDeleting(false);
    }
  };

  const renderIngredientItem = (ingredient, index) => {
    const hasEnough = ingredient.has_enough;
    const isOptional = ingredient.is_optional;
    const isTemporaryAvailable = temporaryAvailable.has(ingredient.id);
    const isActuallyAvailable = hasEnough || isTemporaryAvailable;

    return (
      <View key={index} style={styles.ingredientItem}>
        <View style={styles.ingredientHeader}>
          <View
            style={[
              styles.ingredientStatus,
              {
                backgroundColor: isActuallyAvailable ? "#dcfce7" : "#fef2f2",
                borderColor: isActuallyAvailable ? "#10b981" : "#ef4444",
              },
            ]}
          >
            <Text
              style={[
                styles.ingredientStatusText,
                { color: isActuallyAvailable ? "#10b981" : "#ef4444" },
              ]}
            >
              {isActuallyAvailable ? "✓" : "✗"}
            </Text>
          </View>

          <View style={styles.ingredientInfo}>
            <Text
              style={[
                styles.ingredientName,
                {
                  textDecorationLine: isActuallyAvailable
                    ? "none"
                    : "line-through",
                },
              ]}
            >
              {ingredient.product.name}
              {isOptional && (
                <Text style={styles.optionalText}> (opcional)</Text>
              )}
              {isTemporaryAvailable && (
                <Text style={styles.temporaryText}> (marcado)</Text>
              )}
            </Text>

            <Text style={styles.ingredientQuantity}>
              {ingredient.quantity_needed} unidades
            </Text>

            {ingredient.notes && (
              <Text style={styles.ingredientNotes}>
                {ingredient.notes}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.availabilityInfo}>
          <Text style={styles.availabilityText}>
            Tienes: {ingredient.available_quantity} unidades
          </Text>
          <View style={styles.availabilityBar}>
            <View
              style={[
                styles.availabilityProgress,
                {
                  width: `${Math.min(
                    100,
                    ingredient.availability_percentage
                  )}%`,
                  backgroundColor: hasEnough ? "#10b981" : "#ef4444",
                },
              ]}
            />
          </View>
        </View>

        {!hasEnough && (
          <View style={styles.ingredientActions}>
            <TouchableOpacity
              style={[
                styles.temporaryButton,
                isTemporaryAvailable && styles.temporaryButtonActive,
              ]}
              onPress={() => toggleTemporaryAvailable(ingredient.id)}
            >
              <Text
                style={[
                  styles.temporaryButtonText,
                  isTemporaryAvailable &&
                    styles.temporaryButtonTextActive,
                ]}
              >
                {isTemporaryAvailable
                  ? "✓ Ya lo tengo"
                  : "✓ Marcar como disponible"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Cargando receta...</Text>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          No se pudo cargar la receta
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadRecipeDetail(recipeId, MOCK_USER_ID)}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const difficultyColor = getDifficultyColor(recipe.difficulty);
  const tags = recipe.tags ? recipe.tags.split(",") : [];
  const allIngredients = [
    ...recipe.available_ingredients,
    ...recipe.missing_ingredients,
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        {recipe.image_url && RECIPE_IMAGES[recipe.image_url] && (
          <Image
            source={RECIPE_IMAGES[recipe.image_url]}
            style={styles.headerImage}
            resizeMode="cover"
          />
        )}

        <Text style={styles.title}>{recipe.name}</Text>

        {recipe.description && (
          <Text style={styles.description}>{recipe.description}</Text>
        )}

        <View style={styles.metaInfo}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Tiempo</Text>
            <Text style={styles.metaValue}>
              {formatTime(
                recipe.prep_time_minutes,
                recipe.cook_time_minutes
              )}
            </Text>
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

        {tags.length > 0 && (
          <View style={styles.tags}>
            {tags.map((tag, idx) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>{tag.trim()}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.availabilitySection}>
          <Text style={styles.sectionTitle}>
            Disponibilidad: {getUpdatedAvailability().percentage}%
          </Text>
          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${getUpdatedAvailability().percentage}%`,
                  backgroundColor:
                    getUpdatedAvailability().percentage >= 80
                      ? "#10b981"
                      : getUpdatedAvailability().percentage >= 50
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
                color: getUpdatedAvailability().canMake
                  ? "#10b981"
                  : "#ef4444",
              },
            ]}
          >
            {getUpdatedAvailability().canMake
              ? "✓ Puedes hacer esta receta"
              : "✗ Te faltan ingredientes"}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Ingredientes ({allIngredients.length})
        </Text>

        {recipe.available_ingredients.length > 0 && (
          <View style={styles.ingredientGroup}>
            <Text style={styles.ingredientGroupTitle}>
              ✓ Disponibles ({recipe.available_ingredients.length})
            </Text>
            {recipe.available_ingredients.map(renderIngredientItem)}
          </View>
        )}

        {recipe.missing_ingredients.length > 0 && (
          <View style={styles.ingredientGroup}>
            <Text style={styles.ingredientGroupTitle}>
              ✗ Faltantes ({recipe.missing_ingredients.length})
            </Text>
            {recipe.missing_ingredients.map(renderIngredientItem)}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instrucciones</Text>
        <Text style={styles.instructions}>{recipe.instructions}</Text>
      </View>

      {/* Acciones */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: getUpdatedAvailability().canMake
                ? "#10b981"
                : "#6b7280",
              opacity: getUpdatedAvailability().canMake ? 1 : 0.7,
            },
          ]}
          disabled={!getUpdatedAvailability().canMake}
          onPress={() => {
            if (getUpdatedAvailability().canMake) {
              startCooking();
            }
          }}
        >
          <Text style={styles.actionButtonText}>
            {getUpdatedAvailability().canMake
              ? "Comenzar a cocinar"
              : "Faltan ingredientes"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryActionButton]}
          onPress={() => setShowAddToListModal(true)}
          disabled={addingToList}
        >
          {addingToList ? (
            <ActivityIndicator size="small" color="#059669" />
          ) : (
            <Text style={styles.secondaryActionButtonText}>
              Agregar a lista de compras
            </Text>
          )}
        </TouchableOpacity>

        {/* 👇 NUEVO botón de eliminar */}
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteActionButton]}
          onPress={confirmDeleteRecipe}
          disabled={deleting}
        >
          <Text style={styles.deleteActionButtonText}>
            {deleting ? "Eliminando..." : "Eliminar receta"}
          </Text>
        </TouchableOpacity>
      </View>

      <AddToListModal
        visible={showAddToListModal}
        onClose={() => setShowAddToListModal(false)}
        hasMissing={(recipe.missing_ingredients || []).length > 0}
        allowAllOption={true}
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
  headerImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
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
    justifyContent: "spaceBetween",
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
  ingredientHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  ingredientStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  ingredientStatusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
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
  ingredientNotes: {
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
  },
  availabilityInfo: {
    marginLeft: 36,
  },
  availabilityText: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  availabilityBar: {
    height: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
  },
  availabilityProgress: {
    height: 4,
    borderRadius: 2,
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
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryActionButton: {
    marginTop: 12,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  secondaryActionButtonText: {
    color: "#059669",
    fontSize: 16,
    fontWeight: "600",
  },

  // Estilos para funcionalidad temporal
  temporaryText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#8b5cf6",
    fontStyle: "italic",
  },
  ingredientActions: {
    marginTop: 12,
    marginLeft: 36,
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
  deleteActionButton: {
    marginTop: 12,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  deleteActionButtonText: {
    color: "#b91c1c",
    fontSize: 16,
    fontWeight: "600",
  },
});
