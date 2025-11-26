import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAIRecipes } from "../hooks/useAIRecipes";
import AIGenerationLoader from "../components/AIGenerationLoader";
import ToastContainer from "../components/ToastContainer";
import { useToast } from "../hooks/useToast";

// Mock user ID - en una app real vendría del contexto de autenticación
const MOCK_USER_ID = "demo-user";

export default function AIRecipeGeneratorScreen({ navigation }) {
  // Estados del formulario
  const [selectedTime, setSelectedTime] = useState("30"); // 15, 30, 60
  const [servings, setServings] = useState(4);
  const [difficulty, setDifficulty] = useState("facil"); // facil, intermedio, dificil
  const [cuisineTypes, setCuisineTypes] = useState(["chileno"]); // Array de tipos seleccionados
  const [equipment, setEquipment] = useState(["sarten", "olla"]); // Array de equipos seleccionados
  const [budget, setBudget] = useState("medio"); // bajo, medio, libre
  const [maximizePantry, setMaximizePantry] = useState(true);
  
  // Hook para notificaciones
  const { toasts, hideToast, showSuccess, showError, showInfo, showWarning } = useToast();
  
  // Hook para manejar llamadas a la API
  const { 
    loading: isGenerating, 
    isRetrying,
    retryCount,
    generateRecipes: callGenerateAPI 
  } = useAIRecipes();

  // Opciones disponibles
  const timeOptions = [
    { value: "15", label: "≤15 min", icon: "clock-fast" },
    { value: "30", label: "≤30 min", icon: "clock" },
    { value: "60", label: "≤60 min", icon: "clock-outline" },
  ];

  const difficultyOptions = [
    { value: "facil", label: "Fácil", icon: "emoticon-happy", color: "#10b981" },
    { value: "intermedio", label: "Intermedio", icon: "emoticon-neutral", color: "#f59e0b" },
    { value: "dificil", label: "Avanzado", icon: "emoticon-cool", color: "#ef4444" },
  ];

  const cuisineOptions = [
    { value: "mediterraneo", label: "Mediterráneo", icon: "leaf" },
    { value: "chileno", label: "Chileno", icon: "flag" },
    { value: "asiatico", label: "Asiático", icon: "rice" },
    { value: "vegano", label: "Vegano", icon: "sprout" },
    { value: "vegetariano", label: "Vegetariano", icon: "carrot" },
    { value: "sin_gluten", label: "Sin Gluten", icon: "food-off" },
  ];

  const equipmentOptions = [
    { value: "horno", label: "Horno", icon: "toaster-oven" },
    { value: "sarten", label: "Sartén", icon: "pot" },
    { value: "olla", label: "Olla", icon: "pot-steam" },
    { value: "microondas", label: "Microondas", icon: "microwave" },
    { value: "parrilla", label: "Parrilla", icon: "grill" },
    { value: "olla_presion", label: "Olla presión", icon: "pot-mix" },
  ];

  const budgetOptions = [
    { value: "bajo", label: "Bajo", icon: "currency-usd-off", color: "#ef4444" },
    { value: "medio", label: "Medio", icon: "currency-usd", color: "#f59e0b" },
    { value: "libre", label: "Libre", icon: "cash-multiple", color: "#10b981" },
  ];

  // Funciones para manejar selecciones múltiples
  const toggleCuisineType = (type) => {
    if (cuisineTypes.includes(type)) {
      // Si ya está seleccionado, remover (pero mantener al menos uno)
      if (cuisineTypes.length > 1) {
        setCuisineTypes(cuisineTypes.filter(t => t !== type));
      }
    } else {
      // Si no está seleccionado, agregar
      setCuisineTypes([...cuisineTypes, type]);
    }
  };

  const toggleEquipment = (eq) => {
    if (equipment.includes(eq)) {
      // Si ya está seleccionado, remover (pero mantener al menos uno)
      if (equipment.length > 1) {
        setEquipment(equipment.filter(e => e !== eq));
      }
    } else {
      // Si no está seleccionado, agregar
      setEquipment([...equipment, eq]);
    }
  };

  // Función para cambiar porciones
  const changeServings = (delta) => {
    const newServings = servings + delta;
    if (newServings >= 1 && newServings <= 8) {
      setServings(newServings);
    }
  };

  // Función para generar recetas
  const generateRecipes = async () => {
    try {
      // Validaciones con feedback visual
      if (cuisineTypes.length === 0) {
        showWarning("Selecciona al menos un tipo de cocina", 3000);
        return;
      }
      if (equipment.length === 0) {
        showWarning("Selecciona al menos un equipo disponible", 3000);
        return;
      }
      // Validación extra de porciones
      if (servings < 1 || servings > 8) {
        showWarning("Selecciona entre 1 y 8 porciones", 3000);
        return;
      }

      // Validación de tiempo
      if (!selectedTime) {
        showWarning("Selecciona un tiempo máximo", 3000);
        return;
      }

      // Validación de dificultad
      if (!difficulty) {
        showWarning("Selecciona una dificultad", 3000);
        return;
      }

      // Validación de presupuesto
      if (!budget) {
        showWarning("Selecciona un presupuesto", 3000);
        return;
      }

      showInfo("Preparando generación de recetas...", 2000);

      // Preparar datos para enviar al API
      const requestData = {
        user_id: MOCK_USER_ID,
        max_time_minutes: selectedTime,
        servings: servings,
        difficulty: difficulty,
        cuisine_types: cuisineTypes,
        available_equipment: equipment,
        budget: budget,
        maximize_pantry_use: maximizePantry,
      };

      console.log("Generando recetas con:", requestData);

      // Llamar al API real
      const response = await callGenerateAPI(requestData);
      
      showSuccess("¡3 recetas generadas exitosamente!", 2000);
      
      // Navegar a pantalla de resultados con los datos reales
      navigation.navigate("AIRecipeResults", {
        generationData: requestData,
        generatedRecipes: response.recipes,
        generationTime: response.generation_time_seconds,
        userInventoryItems: response.user_inventory_items
      });

    } catch (error) {
      console.error("Error generando recetas:", error);
      showError("Error generando recetas. Intenta nuevamente.", 3000);
    }
  };

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
        <Text style={styles.title}>Generar con IA</Text>
        <View style={styles.headerRight}>
          <MaterialCommunityIcons name="robot" size={24} color="#059669" />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          {/* Tiempo */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tiempo</Text>
            <View style={styles.optionsRow}>
              {timeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.timeOption,
                    selectedTime === option.value && styles.timeOptionSelected
                  ]}
                  onPress={() => setSelectedTime(option.value)}
                >
                  <MaterialCommunityIcons 
                    name={option.icon} 
                    size={20} 
                    color={selectedTime === option.value ? "#fff" : "#6b7280"} 
                  />
                  <Text style={[
                    styles.timeOptionText,
                    selectedTime === option.value && styles.timeOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Porciones */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Porciones</Text>
            <View style={styles.servingsContainer}>
              <TouchableOpacity 
                style={[styles.servingsButton, servings <= 1 && styles.servingsButtonDisabled]}
                onPress={() => changeServings(-1)}
                disabled={servings <= 1}
              >
                <MaterialCommunityIcons name="minus" size={20} color={servings <= 1 ? "#9ca3af" : "#059669"} />
              </TouchableOpacity>
              
              <View style={styles.servingsDisplay}>
                <Text style={styles.servingsNumber}>{servings}</Text>
                <Text style={styles.servingsLabel}>personas</Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.servingsButton, servings >= 8 && styles.servingsButtonDisabled]}
                onPress={() => changeServings(1)}
                disabled={servings >= 8}
              >
                <MaterialCommunityIcons name="plus" size={20} color={servings >= 8 ? "#9ca3af" : "#059669"} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Dificultad */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dificultad</Text>
            <View style={styles.optionsRow}>
              {difficultyOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.difficultyOption,
                    difficulty === option.value && { backgroundColor: option.color }
                  ]}
                  onPress={() => setDifficulty(option.value)}
                >
                  <MaterialCommunityIcons 
                    name={option.icon} 
                    size={20} 
                    color={difficulty === option.value ? "#fff" : option.color} 
                  />
                  <Text style={[
                    styles.difficultyOptionText,
                    difficulty === option.value && styles.difficultyOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tipo de cocina */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de cocina</Text>
            <Text style={styles.sectionSubtitle}>Selecciona uno o más tipos</Text>
            <View style={styles.optionsGrid}>
              {cuisineOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.cuisineOption,
                    cuisineTypes.includes(option.value) && styles.cuisineOptionSelected
                  ]}
                  onPress={() => toggleCuisineType(option.value)}
                >
                  <MaterialCommunityIcons 
                    name={option.icon} 
                    size={18} 
                    color={cuisineTypes.includes(option.value) ? "#fff" : "#059669"} 
                  />
                  <Text style={[
                    styles.cuisineOptionText,
                    cuisineTypes.includes(option.value) && styles.cuisineOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Equipo disponible */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Equipo disponible</Text>
            <Text style={styles.sectionSubtitle}>Selecciona los equipos que tienes</Text>
            <View style={styles.optionsGrid}>
              {equipmentOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.equipmentOption,
                    equipment.includes(option.value) && styles.equipmentOptionSelected
                  ]}
                  onPress={() => toggleEquipment(option.value)}
                >
                  <MaterialCommunityIcons 
                    name={option.icon} 
                    size={18} 
                    color={equipment.includes(option.value) ? "#fff" : "#6b7280"} 
                  />
                  <Text style={[
                    styles.equipmentOptionText,
                    equipment.includes(option.value) && styles.equipmentOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Presupuesto */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Presupuesto</Text>
            <View style={styles.optionsRow}>
              {budgetOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.budgetOption,
                    budget === option.value && { backgroundColor: option.color }
                  ]}
                  onPress={() => setBudget(option.value)}
                >
                  <MaterialCommunityIcons 
                    name={option.icon} 
                    size={20} 
                    color={budget === option.value ? "#fff" : option.color} 
                  />
                  <Text style={[
                    styles.budgetOptionText,
                    budget === option.value && styles.budgetOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Maximizar uso de despensa */}
          <View style={styles.section}>
            <View style={styles.toggleContainer}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Maximizar uso de mi despensa</Text>
                <Text style={styles.toggleSubtitle}>
                  Prioriza productos con mayor stock
                </Text>
              </View>
              <Switch
                value={maximizePantry}
                onValueChange={setMaximizePantry}
                trackColor={{ false: "#d1d5db", true: "#a7f3d0" }}
                thumbColor={maximizePantry ? "#059669" : "#f3f4f6"}
                ios_backgroundColor="#d1d5db"
              />
            </View>
          </View>

        </View>
      </ScrollView>

      {/* Botón de generar */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
          onPress={() => {
            if (isGenerating) {
              showInfo("Ya estamos generando tus recetas...", 2000);
              return;
            }
            generateRecipes();
          }}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialCommunityIcons name="robot" size={20} color="#fff" />
          )}
          <Text style={styles.generateButtonText}>
            {isGenerating ? "Generando..." : "Generar recetas"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loader de generación */}
      <AIGenerationLoader
        isLoading={isGenerating}
        isRetrying={isRetrying}
        retryCount={retryCount}
        onCancel={() => {
          // En una implementación real, cancelaríamos la request
          Alert.alert("Cancelado", "Generación cancelada por el usuario");
        }}
      />

      {/* Contenedor de notificaciones toast */}
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
  headerRight: {
    width: 40,
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100, // Espacio para el botón flotante
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 12,
  },
  
  // Tiempo
  optionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  timeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  timeOptionSelected: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  timeOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  timeOptionTextSelected: {
    color: "#fff",
  },

  // Porciones
  servingsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  servingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  servingsButtonDisabled: {
    opacity: 0.5,
  },
  servingsDisplay: {
    alignItems: "center",
    minWidth: 80,
  },
  servingsNumber: {
    fontSize: 32,
    fontWeight: "700",
    color: "#059669",
  },
  servingsLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },

  // Dificultad
  difficultyOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  difficultyOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  difficultyOptionTextSelected: {
    color: "#fff",
  },

  // Tipo de cocina y equipos
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cuisineOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: "47%",
  },
  cuisineOptionSelected: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  cuisineOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  cuisineOptionTextSelected: {
    color: "#fff",
  },
  equipmentOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: "47%",
  },
  equipmentOptionSelected: {
    backgroundColor: "#6b7280",
    borderColor: "#6b7280",
  },
  equipmentOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  equipmentOptionTextSelected: {
    color: "#fff",
  },

  // Presupuesto
  budgetOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  budgetOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  budgetOptionTextSelected: {
    color: "#fff",
  },

  // Toggle
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    padding: 16,
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#059669",
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});