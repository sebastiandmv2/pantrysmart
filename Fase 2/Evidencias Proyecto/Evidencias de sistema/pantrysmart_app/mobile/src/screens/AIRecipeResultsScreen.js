// pantrysmart_app/mobile/src/screens/AIRecipeResultsScreen.js

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAIRecipes } from "../hooks/useAIRecipes";
import AIGenerationLoader from "../components/AIGenerationLoader";
import RecipeSavedModal from "../components/RecipeSavedModal";
import SuccessAnimation from "../components/SuccessAnimation";
import ToastContainer from "../components/ToastContainer";
import { useToast } from "../hooks/useToast";
import AddToListModal from "../components/AddToListModal";
import { addItemsToList } from "../services/userLists";


const MOCK_USER_ID = "demo-user";

export default function AIRecipeResultsScreen({ navigation, route }) {
  const {
    generatedRecipes,
    generationData,
    generationTime,
    userInventoryItems,
  } = route.params || {};

  const [recipes, setRecipes] = useState(generatedRecipes || []);
  const [loading, setLoading] = useState(!generatedRecipes);
  const [refreshing, setRefreshing] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState(null);
  const [addingToList, setAddingToList] = useState(null);
  const [savedModalVisible, setSavedModalVisible] = useState(false);
  const [savedRecipeName, setSavedRecipeName] = useState("");
  const [aiStats, setAiStats] = useState(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // 👇 NUEVO: para elegir lista cuando se tocan los “faltantes”
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [selectedRecipeForList, setSelectedRecipeForList] = useState(null);

  const {
    toasts,
    hideToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  } = useToast();

  // Hooks para API calls
  const {
    loading: aiLoading,
    isRetrying,
    retryCount,
    generateRecipes: callGenerateAPI,
    saveGeneratedRecipe,
    retryLastGeneration,
    getAIStats,
    canRetry,
  } = useAIRecipes();


  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      if (generatedRecipes && generatedRecipes.length > 0) {
        setRecipes(generatedRecipes);
        setLoading(false);
        return;
      }

      if (generationData) {
        setLoading(true);
        const response = await callGenerateAPI(generationData);
        setRecipes(response.recipes || []);
      }
    } catch (error) {
      console.error("Error loading recipes:", error);
      Alert.alert("Error", "No se pudieron cargar las recetas generadas");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecipes();
    setRefreshing(false);
  };

  const handleOpenRecipe = (recipe) => {
    // 👈 IMPORTANTE: ir a la pantalla de detalle IA con la receta en memoria
    navigation.navigate("AIRecipeDetail", {
      recipe,
      generationTime,
      userInventoryItems,
    });
  };

const saveRecipe = async (recipe) => {
  try {
    const recipeKey = recipe.id || recipe.name;

      const requestData = {
        user_id: MOCK_USER_ID,
        recipe: recipe,
      };

      await saveGeneratedRecipe(requestData);

      setShowSuccessAnimation(true);
      showSuccess(`"${recipe.name}" guardada exitosamente`, 2500);

      try {
        const stats = await getAIStats();
        setAiStats(stats);
      } catch (statsError) {
        console.warn("Error getting AI stats:", statsError);
      }

      setTimeout(() => {
        setSavedRecipeName(recipe.name);
        setSavedModalVisible(true);
      }, 1500);
    } catch (error) {
      console.error("Error saving recipe:", error);
      showError("Error guardando receta. Intenta nuevamente.", 3000);
    } finally {
      setSavingRecipe(null);
    }
  };

  // Abrir modal para elegir a qué lista agregar los faltantes
  const openAddMissingModal = (recipe) => {
    if (!recipe.missing_ingredients || recipe.missing_ingredients.length === 0) {
      showInfo("Esta receta no tiene ingredientes faltantes", 2000);
      return;
    }
    setSelectedRecipeForList(recipe);
    setShowAddToListModal(true);
  };

  // Confirmar desde el modal y guardar en la lista elegida
  const handleConfirmAddToList = async ({ listId }) => {
    if (!selectedRecipeForList) return;

    const recipe = selectedRecipeForList;
    const recipeKey = recipe.id || recipe.name;

    try {
      setAddingToList(recipeKey);

      const missing = recipe.missing_ingredients || [];
      if (missing.length === 0) {
        Alert.alert("Sin ingredientes", "Esta receta no tiene ingredientes faltantes.");
        return;
      }

      const itemsToAdd = missing.map((name) => ({
        name,
        quantity: null,
        unit: null,
        fromAI: true,
        fromRecipeName: recipe.name,
      }));

      // 1) Agregar los faltantes a la lista seleccionada
      await addItemsToList(listId, itemsToAdd);

      // 2) Guardar la receta en el backend de forma silenciosa
      try {
        await saveGeneratedRecipe({
          user_id: MOCK_USER_ID,
          recipe,
        });
      } catch (saveErr) {
        console.warn(
          "Error auto-guardando receta IA al agregar faltantes:",
          saveErr
        );
        // No rompemos el flujo si sólo falla el guardado
      }

      setShowAddToListModal(false);
      setSelectedRecipeForList(null);

      showSuccess(
        `${itemsToAdd.length} ingredientes agregados a tu lista de compras`,
        3000
      );

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
      console.error("Error adding AI missing ingredients to list:", error);
      showError("Error agregando ingredientes. Intenta nuevamente.", 3000);
    } finally {
      setAddingToList(null);
    }
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

  const getAvailabilityColor = (percentage) => {
    if (percentage >= 80) return "#10b981";
    if (percentage >= 50) return "#f59e0b";
    return "#ef4444";
  };

  // Abrir detalle de la receta IA (sin ir al backend, con los datos en memoria)
  const openRecipeDetail = (recipe) => {
    navigation.navigate("AIRecipeDetail", {
      recipe,              // 👈 mandamos el objeto completo
      generationTime,      // por si quieres mostrarlo
      userInventoryItems,  // para el texto de "X ítems analizados"
    });
  };

  const renderRecipeCard = (recipe, index) => {
    const tags = recipe.tags ? recipe.tags.split(",") : [];
    const difficultyColor = getDifficultyColor(recipe.difficulty);
    const availabilityColor = getAvailabilityColor(
      recipe.availability_percentage
    );
    const totalTime =
      (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);
    const recipeKey = recipe.id || recipe.name || index;
    const isSaving = savingRecipe === recipeKey;
    const isAdding = addingToList === recipeKey;

    return (
      <TouchableOpacity
        key={`${recipe.name}-${index}`}
        activeOpacity={0.9}
        style={styles.recipeCardWrapper}
        onPress={() => openRecipeDetail(recipe)}   // 👈 AQUÍ navegamos al detalle
      >
        <View style={styles.recipeCard}>
          {/* Header con número de receta */}
          <View style={styles.recipeHeader}>
            <View style={styles.recipeNumber}>
              <Text style={styles.recipeNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.recipeHeaderInfo}>
              <Text style={styles.recipeName} numberOfLines={2}>
                {recipe.name}
              </Text>
              {recipe.description ? (
                <Text style={styles.recipeDescription} numberOfLines={2}>
                  {recipe.description}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Imagen placeholder */}
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>🍽️</Text>
            <Text style={styles.imagePlaceholderLabel}>
              Receta generada por IA
            </Text>
          </View>

          {/* Información básica */}
          <View style={styles.recipeInfo}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={16}
                  color="#6b7280"
                />
                <Text style={styles.infoText}>{totalTime} min</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons
                  name="account-group"
                  size={16}
                  color="#6b7280"
                />
                <Text style={styles.infoText}>
                  {recipe.servings} porciones
                </Text>
              </View>
              <View
                style={[
                  styles.difficultyBadge,
                  { backgroundColor: `${difficultyColor}20` },
                ]}
              >
                <Text
                  style={[styles.difficultyText, { color: difficultyColor }]}
                >
                  {getDifficultyText(recipe.difficulty)}
                </Text>
              </View>
            </View>

            {/* Tags */}
            <View style={styles.tagsContainer}>
              {tags.slice(0, 3).map((tag, idx) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{tag.trim()}</Text>
                </View>
              ))}
            </View>

            {/* Barra de disponibilidad */}
            <View style={styles.availabilitySection}>
              <View style={styles.availabilityHeader}>
                <Text style={styles.availabilityLabel}>
                  Disponibilidad de ingredientes
                </Text>
                <Text
                  style={[
                    styles.availabilityPercentage,
                    { color: availabilityColor },
                  ]}
                >
                  {recipe.availability_percentage}%
                </Text>
              </View>
              <View style={styles.progressBackground}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${recipe.availability_percentage}%`,
                      backgroundColor: availabilityColor,
                    },
                  ]}
                />
              </View>
              {recipe.missing_ingredients &&
                recipe.missing_ingredients.length > 0 && (
                  <Text style={styles.missingText}>
                    Faltan: {recipe.missing_ingredients.join(", ")}
                  </Text>
                )}
            </View>

            {/* Botones de acción */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={() => saveRecipe(recipe)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialCommunityIcons
                    name="heart-outline"
                    size={18}
                    color="#fff"
                  />
                )}
                <Text style={styles.saveButtonText}>
                  {isSaving ? "Guardando..." : "Guardar"}
                </Text>
              </TouchableOpacity>

              {recipe.missing_ingredients &&
                recipe.missing_ingredients.length > 0 && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.listButton]}
                    onPress={() => openAddMissingModal(recipe)}
                    disabled={isAdding}
                  >
                    {isAdding ? (
                      <ActivityIndicator size="small" color="#059669" />
                    ) : (
                      <MaterialCommunityIcons
                        name="format-list-checks"
                        size={18}
                        color="#059669"
                      />
                    )}
                    <Text style={styles.listButtonText}>
                      {isAdding ? "Agregando..." : "Agregar faltantes"}
                    </Text>
                  </TouchableOpacity>
                )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Generando recetas con IA...</Text>
        <Text style={styles.loadingSubtext}>Esto puede tomar unos segundos</Text>
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
        <Text style={styles.title}>Recetas Generadas</Text>
        <View style={styles.headerActions}>
          {canRetry && (
            <TouchableOpacity
              style={[styles.headerButton, styles.retryButton]}
              onPress={() => {
                showInfo("Reintentando generación...", 2000);
                retryLastGeneration();
              }}
              disabled={aiLoading}
            >
              <MaterialCommunityIcons
                name="refresh"
                size={18}
                color={aiLoading ? "#9ca3af" : "#f59e0b"}
              />
            </TouchableOpacity>
          )}
          {!canRetry && (
            <TouchableOpacity
              style={[
                styles.headerButton,
                styles.retryButton,
                { opacity: 0.4 },
              ]}
              onPress={() =>
                showWarning("No quedan reintentos disponibles", 2500)
              }
            >
              <MaterialCommunityIcons
                name="refresh"
                size={18}
                color="#9ca3af"
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.headerButton, styles.regenerateButton]}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="robot" size={18} color="#059669" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Subtitle */}
      <View style={styles.subtitle}>
        <MaterialCommunityIcons name="robot" size={20} color="#059669" />
        <Text style={styles.subtitleText}>
          {recipes.length} recetas creadas especialmente para ti
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#059669"]}
          />
        }
      >
        <View style={styles.recipesContainer}>
          {recipes.map((recipe, index) => renderRecipeCard(recipe, index))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => navigation.navigate("Recipes")}
          >
            <MaterialCommunityIcons
              name="book-open-variant"
              size={20}
              color="#059669"
            />
            <Text style={styles.footerButtonText}>Ver todas las recetas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons
              name="robot"
              size={20}
              color="#059669"
            />
            <Text style={styles.footerButtonText}>
              Generar nuevas recetas
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Loader para regeneración */}
      <AIGenerationLoader
        isLoading={aiLoading}
        isRetrying={isRetrying}
        retryCount={retryCount}
        generationStep="Regenerando recetas..."
        onCancel={() => {
          Alert.alert("Cancelado", "Regeneración cancelada");
        }}
      />

      {/* Modal de receta guardada */}
      <RecipeSavedModal
        visible={savedModalVisible}
        onClose={() => setSavedModalVisible(false)}
        recipeName={savedRecipeName}
        aiStats={aiStats}
        onViewRecipes={() => {
          setSavedModalVisible(false);
          navigation.navigate("Recipes");
        }}
      />

      {/* Animación de éxito */}
      <SuccessAnimation
        visible={showSuccessAnimation}
        onComplete={() => setShowSuccessAnimation(false)}
        icon="heart"
        color="#059669"
        size={72}
      />

      {/* Modal para elegir a qué lista se agregan los faltantes */}
      <AddToListModal
        visible={showAddToListModal}
        onClose={() => {
          setShowAddToListModal(false);
          setSelectedRecipeForList(null);
        }}
        hasMissing={
          !!selectedRecipeForList?.missing_ingredients &&
          selectedRecipeForList.missing_ingredients.length > 0
        }
        allowAllOption={false} // aquí sólo tiene sentido “faltantes”
        onConfirm={handleConfirmAddToList}
      />


      {/* Toasts */}
      <ToastContainer toasts={toasts} onHideToast={hideToast} />
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
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "center",
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fff",
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
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  retryButton: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#fcd34d",
  },
  regenerateButton: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  subtitle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#ecfdf5",
    borderBottomWidth: 1,
    borderBottomColor: "#a7f3d0",
  },
  subtitleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
  },
  scrollView: {
    flex: 1,
  },
  recipesContainer: {
    padding: 16,
    gap: 20,
  },
  recipeCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  recipeHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: "#f9fafb",
  },
  recipeNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  recipeNumberText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  recipeHeaderInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  recipeDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  imagePlaceholder: {
    height: 120,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  imagePlaceholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  imagePlaceholderLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  recipeInfo: {
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: "auto",
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: "600",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: "#ecfdf5",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#059669",
  },
  availabilitySection: {
    marginBottom: 16,
  },
  availabilityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  availabilityLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  availabilityPercentage: {
    fontSize: 14,
    fontWeight: "700",
  },
  progressBackground: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  missingText: {
    fontSize: 12,
    color: "#ef4444",
    fontStyle: "italic",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: "#059669",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  listButton: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  listButtonText: {
    color: "#059669",
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  footerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingVertical: 12,
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
  },
  recipeCardWrapper: {
    borderRadius: 16,
  },
});
