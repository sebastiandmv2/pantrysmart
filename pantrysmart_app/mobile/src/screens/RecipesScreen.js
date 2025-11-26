import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRecipes } from "../hooks/useRecipes";

// Mock user ID - en una app real vendría del contexto de autenticación
const MOCK_USER_ID = "demo-user";

// Mapeo de imágenes locales
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

export default function RecipesScreen({ navigation }) {
  const {
    recipes,
    loading,
    error,
    refreshing,
    refreshRecipes,
    searchRecipes,
  } = useRecipes(MOCK_USER_ID);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' para menor a mayor, 'desc' para mayor a menor
  const [filterType, setFilterType] = useState("all"); // 'all', 'ai', 'traditional'

  useEffect(() => {
    if (error) {
      Alert.alert("Error", error);
    }
  }, [error]);

  const handleSearch = (text) => {
    setSearchTerm(text);
    if (text.length > 2) {
      searchRecipes(text);
    } else if (text.length === 0) {
      refreshRecipes();
    }
  };

  const handleRecipePress = (recipe) => {
    navigation.navigate("RecipeDetail", {
      recipeId: recipe.id,
      recipeName: recipe.name,
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

  const formatTime = (prepTime, cookTime) => {
    const total = prepTime + (cookTime || 0);
    return `${total} min`;
  };

  const isAIRecipe = (recipe) => {
    return recipe.tags && recipe.tags.toLowerCase().includes("generada_por_ia");
  };

  const getFilteredRecipes = () => {
    let filtered = recipes;

    if (filterType === "ai") {
      filtered = recipes.filter((recipe) => isAIRecipe(recipe));
    } else if (filterType === "traditional") {
      filtered = recipes.filter((recipe) => !isAIRecipe(recipe));
    }

    return filtered;
  };

  const getSortedRecipes = () => {
    const filteredRecipes = getFilteredRecipes();
    const sortedRecipes = [...filteredRecipes].sort((a, b) => {
      if (sortOrder === "desc") {
        return b.availability_percentage - a.availability_percentage;
      } else {
        return a.availability_percentage - b.availability_percentage;
      }
    });
    return sortedRecipes;
  };

  const renderRecipeCard = ({ item }) => {
    const tags = item.tags ? item.tags.split(",") : [];
    const difficultyColor = getDifficultyColor(item.difficulty);
    const isAI = isAIRecipe(item);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleRecipePress(item)}
      >
        {/* Imagen de la receta */}
        {item.image_url && RECIPE_IMAGES[item.image_url] ? (
          <Image
            source={RECIPE_IMAGES[item.image_url]}
            style={styles.recipeImage}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.imagePlaceholder,
              isAI && styles.aiImagePlaceholder,
            ]}
          >
            <Text style={styles.imagePlaceholderText}>
              {isAI ? "🤖" : "🍽️"}
            </Text>
            {isAI && (
              <View style={styles.aiIndicator}>
                <Text style={styles.aiIndicatorText}>IA</Text>
              </View>
            )}
          </View>
        )}

        {/* Indicador IA en imagen real */}
        {isAI && item.image_url && RECIPE_IMAGES[item.image_url] && (
          <View style={styles.aiIndicatorOverlay}>
            <Text style={styles.aiIndicatorText}>IA</Text>
          </View>
        )}

        {/* Contenido */}
        <View style={styles.content}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.row}>
            <Text style={styles.meta}>
              {formatTime(item.prep_time_minutes, item.cook_time_minutes)}
            </Text>
            <Text style={styles.meta}>• {item.servings} porciones</Text>
          </View>

          {/* Tags */}
          <View style={styles.tags}>
            <View
              style={[
                styles.tag,
                { backgroundColor: `${difficultyColor}20` },
              ]}
            >
              <Text style={[styles.tagText, { color: difficultyColor }]}>
                {getDifficultyText(item.difficulty)}
              </Text>
            </View>
            {tags.slice(0, 2).map((tag, idx) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>{tag.trim()}</Text>
              </View>
            ))}
          </View>

          {/* Barra de disponibilidad */}
          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${item.availability_percentage}%`,
                  backgroundColor:
                    item.availability_percentage >= 80
                      ? "#10b981"
                      : item.availability_percentage >= 50
                      ? "#f59e0b"
                      : "#ef4444",
                },
              ]}
            />
          </View>
          <Text style={styles.availability}>
            Disponibilidad: {item.availability_percentage}%
          </Text>

          <Text style={styles.ingredientCount}>
            {item.ingredient_count} ingredientes
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && recipes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Cargando recetas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#111" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              Alert.alert(
                "Ordenar por disponibilidad",
                "Selecciona el orden de las recetas",
                [
                  {
                    text: "Mayor a menor",
                    onPress: () => setSortOrder("desc"),
                  },
                  { text: "Menor a mayor", onPress: () => setSortOrder("asc") },
                  { text: "Cancelar", style: "cancel" },
                ]
              );
            }}
          >
            <MaterialCommunityIcons
              name={sortOrder === "desc" ? "sort-descending" : "sort-ascending"}
              size={20}
              color="#059669"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Recetas</Text>

        <TouchableOpacity
          style={styles.aiButton}
          onPress={() => {
            navigation.navigate("AIRecipeGenerator");
          }}
        >
          <MaterialCommunityIcons name="robot" size={20} color="#fff" />
          <Text style={styles.aiButtonText}>IA</Text>
        </TouchableOpacity>
      </View>

      {/* 👇 Ya NO hay barra de Stats IA. Sólo los botones de filtro */}
      <View style={styles.typeFiltersContainer}>
        <TouchableOpacity
          style={[
            styles.typeFilterButton,
            filterType === "all" && styles.typeFilterButtonActive,
          ]}
          onPress={() => setFilterType("all")}
        >
          <MaterialCommunityIcons
            name="book-open-variant"
            size={16}
            color={filterType === "all" ? "#fff" : "#6b7280"}
          />
          <Text
            style={[
              styles.typeFilterText,
              filterType === "all" && styles.typeFilterTextActive,
            ]}
          >
            Todas ({recipes.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeFilterButton,
            filterType === "traditional" && styles.typeFilterButtonActive,
          ]}
          onPress={() => setFilterType("traditional")}
        >
          <MaterialCommunityIcons
            name="chef-hat"
            size={16}
            color={filterType === "traditional" ? "#fff" : "#6b7280"}
          />
          <Text
            style={[
              styles.typeFilterText,
              filterType === "traditional" && styles.typeFilterTextActive,
            ]}
          >
            Chilenas ({recipes.filter((r) => !isAIRecipe(r)).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeFilterButton,
            filterType === "ai" && styles.typeFilterButtonActive,
          ]}
          onPress={() => setFilterType("ai")}
        >
          <MaterialCommunityIcons
            name="robot"
            size={16}
            color={filterType === "ai" ? "#fff" : "#8b5cf6"}
          />
          <Text
            style={[
              styles.typeFilterText,
              filterType === "ai" && styles.typeFilterTextActive,
            ]}
          >
            IA ({recipes.filter((r) => isAIRecipe(r)).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Indicador de ordenamiento */}
      <View style={styles.filterIndicator}>
        <MaterialCommunityIcons
          name={sortOrder === "desc" ? "sort-descending" : "sort-ascending"}
          size={16}
          color="#059669"
        />
        <Text style={styles.filterIndicatorText}>
          Ordenado por disponibilidad{" "}
          {sortOrder === "desc" ? "mayor a menor" : "menor a mayor"}
        </Text>
      </View>

      {/* Barra de búsqueda */}
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar recetas..."
        value={searchTerm}
        onChangeText={handleSearch}
      />

      <FlatList
        data={getSortedRecipes()}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderRecipeCard}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshRecipes}
            colors={["#059669"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name={
                filterType === "ai"
                  ? "robot"
                  : filterType === "traditional"
                  ? "chef-hat"
                  : "book-open-variant"
              }
              size={64}
              color="#9ca3af"
            />
            <Text style={styles.emptyTitle}>
              {searchTerm
                ? "No se encontraron recetas"
                : filterType === "ai"
                ? "No hay recetas IA"
                : filterType === "traditional"
                ? "No hay recetas chilenas"
                : "No hay recetas disponibles"}
            </Text>
            <Text style={styles.emptyText}>
              {searchTerm
                ? "Intenta con otros términos de búsqueda"
                : filterType === "ai"
                ? "Genera tu primera receta con inteligencia artificial"
                : filterType === "traditional"
                ? "Las recetas tradicionales se están cargando..."
                : "Las recetas se están cargando..."}
            </Text>
            {filterType === "ai" && !searchTerm && (
              <TouchableOpacity
                style={styles.generateAIButton}
                onPress={() => navigation.navigate("AIRecipeGenerator")}
              >
                <MaterialCommunityIcons name="robot" size={16} color="#fff" />
                <Text style={styles.generateAIButtonText}>
                  Generar con IA
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#059669",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  aiButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
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
    color: "#059669",
    fontWeight: "600",
  },
  searchInput: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
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
  listContainer: {
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
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
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recipeImage: {
    width: 100,
    height: 120,
  },
  imagePlaceholder: {
    width: 100,
    height: 120,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    fontSize: 32,
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    color: "#1f2937",
    lineHeight: 22,
  },
  row: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
  },
  meta: {
    fontSize: 12,
    color: "#6b7280",
    marginRight: 8,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
    gap: 4,
  },
  tag: {
    backgroundColor: "#ecfdf5",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#059669",
  },
  progressBackground: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  availability: {
    fontSize: 11,
    color: "#374151",
    fontWeight: "500",
  },
  ingredientCount: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  typeFiltersContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  typeFilterButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  typeFilterButtonActive: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  typeFilterText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
  },
  typeFilterTextActive: {
    color: "#fff",
  },
  aiImagePlaceholder: {
    backgroundColor: "#f3f4f6",
    borderWidth: 2,
    borderColor: "#8b5cf6",
    position: "relative",
  },
  aiIndicator: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#8b5cf6",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  aiIndicatorOverlay: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#8b5cf6",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  aiIndicatorText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#fff",
  },
  generateAIButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#8b5cf6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  generateAIButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
