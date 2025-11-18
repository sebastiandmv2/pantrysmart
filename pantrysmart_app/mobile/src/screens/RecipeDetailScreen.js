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
import { useRecipeDetail } from "../hooks/useRecipes";

// Mock user ID - en una app real vendría del contexto de autenticación
const MOCK_USER_ID = "demo-user";

// Mapeo de imágenes locales
const RECIPE_IMAGES = {
  'empanadas-pino.jpg': require('../../assets/recipes/empanadas-pino.jpg'),
  'pastel-choclo.jpeg': require('../../assets/recipes/pastel-choclo.jpeg'),
  'cazuela-pollo.jpg': require('../../assets/recipes/cazuela-pollo.jpg'),
  'completo-italiano.jpg': require('../../assets/recipes/completo-italiano.jpg'),
  'porotos-rienda.jpg': require('../../assets/recipes/porotos-rienda.jpg'),
  'arroz-pollo.jpg': require('../../assets/recipes/arroz-pollo.jpg'),
  'charquican.jpg': require('../../assets/recipes/charquican.jpg'),
  'sopaipillas.jpg': require('../../assets/recipes/sopaipillas.jpg'),
  'lomo-pobre.jpg': require('../../assets/recipes/lomo-pobre.jpg'),
  'pan-amasado.jpeg': require('../../assets/recipes/pan-amasado.jpeg'),
};

export default function RecipeDetailScreen({ route, navigation }) {
  const { recipeId, recipeName } = route.params;
  const { recipe, loading, error, loadRecipeDetail } = useRecipeDetail();

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
      case "facil": return "#10b981";
      case "intermedio": return "#f59e0b";
      case "dificil": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getDifficultyText = (difficulty) => {
    switch (difficulty) {
      case "facil": return "Fácil";
      case "intermedio": return "Intermedio";
      case "dificil": return "Difícil";
      default: return difficulty;
    }
  };

  const formatTime = (prepTime, cookTime) => {
    const total = prepTime + (cookTime || 0);
    return `${total} min`;
  };

  const renderIngredientItem = (ingredient, index) => {
    const hasEnough = ingredient.has_enough;
    const isOptional = ingredient.is_optional;
    
    return (
      <View key={index} style={styles.ingredientItem}>
        <View style={styles.ingredientHeader}>
          <View style={[
            styles.ingredientStatus, 
            { 
              backgroundColor: hasEnough ? '#dcfce7' : '#fef2f2',
              borderColor: hasEnough ? '#10b981' : '#ef4444',
            }
          ]}>
            <Text style={[
              styles.ingredientStatusText,
              { color: hasEnough ? '#10b981' : '#ef4444' }
            ]}>
              {hasEnough ? '✓' : '✗'}
            </Text>
          </View>
          
          <View style={styles.ingredientInfo}>
            <Text style={[
              styles.ingredientName,
              { textDecorationLine: hasEnough ? 'none' : 'line-through' }
            ]}>
              {ingredient.product.name}
              {isOptional && <Text style={styles.optionalText}> (opcional)</Text>}
            </Text>
            
            <Text style={styles.ingredientQuantity}>
              {ingredient.quantity_needed} {ingredient.unit}
            </Text>
            
            {ingredient.notes && (
              <Text style={styles.ingredientNotes}>{ingredient.notes}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.availabilityInfo}>
          <Text style={styles.availabilityText}>
            Tienes: {ingredient.available_quantity} {ingredient.unit}
          </Text>
          <View style={styles.availabilityBar}>
            <View 
              style={[
                styles.availabilityProgress,
                { 
                  width: `${Math.min(100, ingredient.availability_percentage)}%`,
                  backgroundColor: hasEnough ? '#10b981' : '#ef4444'
                }
              ]}
            />
          </View>
        </View>
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
        <Text style={styles.errorText}>No se pudo cargar la receta</Text>
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
  const tags = recipe.tags ? recipe.tags.split(',') : [];
  const allIngredients = [...recipe.available_ingredients, ...recipe.missing_ingredients];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header con información básica */}
      <View style={styles.header}>
        {/* Imagen de la receta */}
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
              {formatTime(recipe.prep_time_minutes, recipe.cook_time_minutes)}
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Porciones</Text>
            <Text style={styles.metaValue}>{recipe.servings}</Text>
          </View>
          
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Dificultad</Text>
            <View style={[styles.difficultyBadge, { backgroundColor: `${difficultyColor}20` }]}>
              <Text style={[styles.difficultyText, { color: difficultyColor }]}>
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

        {/* Disponibilidad general */}
        <View style={styles.availabilitySection}>
          <Text style={styles.sectionTitle}>
            Disponibilidad: {recipe.availability_percentage}%
          </Text>
          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressBar,
                { 
                  width: `${recipe.availability_percentage}%`,
                  backgroundColor: recipe.availability_percentage >= 80 ? '#10b981' : 
                                 recipe.availability_percentage >= 50 ? '#f59e0b' : '#ef4444'
                }
              ]}
            />
          </View>
          <Text style={[
            styles.canMakeText,
            { color: recipe.can_make ? '#10b981' : '#ef4444' }
          ]}>
            {recipe.can_make ? '✓ Puedes hacer esta receta' : '✗ Te faltan ingredientes'}
          </Text>
        </View>
      </View>

      {/* Ingredientes */}
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

      {/* Instrucciones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instrucciones</Text>
        <Text style={styles.instructions}>{recipe.instructions}</Text>
      </View>

      {/* Botón de acción */}
      <View style={styles.actionSection}>
        <TouchableOpacity 
          style={[
            styles.actionButton,
            { 
              backgroundColor: recipe.can_make ? '#10b981' : '#6b7280',
              opacity: recipe.can_make ? 1 : 0.7
            }
          ]}
          disabled={!recipe.can_make}
        >
          <Text style={styles.actionButtonText}>
            {recipe.can_make ? 'Comenzar a cocinar' : 'Faltan ingredientes'}
          </Text>
        </TouchableOpacity>
      </View>
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
});