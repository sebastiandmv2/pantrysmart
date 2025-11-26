import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function RecipeSavedModal({ 
  visible, 
  onClose, 
  recipeName,
  onViewRecipes,
  onViewStats,
  aiStats 
}) {
  const [showStats, setShowStats] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animación de entrada
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Animación de bounce para el icono de éxito
      setTimeout(() => {
        Animated.spring(bounceAnim, {
          toValue: 1,
          tension: 80,
          friction: 4,
          useNativeDriver: true,
        }).start();
      }, 200);
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      bounceAnim.setValue(0);
    }
  }, [visible, scaleAnim, fadeAnim, bounceAnim]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        <Animated.View 
          style={[
            styles.container,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          {/* Icono de éxito animado */}
          <Animated.View 
            style={[
              styles.successIcon,
              { transform: [{ scale: bounceAnim }] }
            ]}
          >
            <MaterialCommunityIcons name="check-circle" size={64} color="#10b981" />
          </Animated.View>

          {/* Mensaje principal */}
          <Text style={styles.title}>¡Receta guardada!</Text>
          <Text style={styles.subtitle}>
            "{recipeName}" se agregó exitosamente a tus recetas
          </Text>

          {/* Estadísticas */}
          {aiStats && (
            <View style={styles.statsContainer}>
              <TouchableOpacity 
                style={styles.statsToggle}
                onPress={() => setShowStats(!showStats)}
              >
                <MaterialCommunityIcons 
                  name={showStats ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#6b7280" 
                />
                <Text style={styles.statsToggleText}>
                  {showStats ? "Ocultar" : "Ver"} estadísticas
                </Text>
              </TouchableOpacity>

              {showStats && (
                <View style={styles.statsContent}>
                  <View style={styles.statRow}>
                    <MaterialCommunityIcons name="robot" size={16} color="#8b5cf6" />
                    <Text style={styles.statText}>
                      {aiStats.ai_recipes_count} recetas generadas por IA
                    </Text>
                  </View>
                  <View style={styles.statRow}>
                    <MaterialCommunityIcons name="package-variant-closed" size={16} color="#059669" />
                    <Text style={styles.statText}>
                      {aiStats.auto_products_count} productos creados automáticamente
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Tags informativos */}
          <View style={styles.tagsContainer}>
            <View style={styles.tag}>
              <MaterialCommunityIcons name="robot" size={14} color="#8b5cf6" />
              <Text style={styles.tagText}>Generada por IA</Text>
            </View>
            <View style={styles.tag}>
              <MaterialCommunityIcons name="package-variant-closed" size={14} color="#059669" />
              <Text style={styles.tagText}>Productos auto-creados</Text>
            </View>
          </View>

          {/* Botones de acción */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]}
              onPress={onViewRecipes}
            >
              <MaterialCommunityIcons name="book-open-variant" size={18} color="#fff" />
              <Text style={styles.primaryButtonText}>Ver mis recetas</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]}
              onPress={onClose}
            >
              <Text style={styles.secondaryButtonText}>Continuar</Text>
            </TouchableOpacity>
          </View>

          {/* Información adicional */}
          <Text style={styles.infoText}>
            💡 Los ingredientes faltantes se crearon automáticamente en el catálogo
          </Text>
        </Animated.View>
      </Animated.View>
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
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    maxWidth: 340,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  successIcon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  statsContainer: {
    width: "100%",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  statsToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  statsToggleText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  statsContent: {
    marginTop: 12,
    gap: 8,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statText: {
    fontSize: 12,
    color: "#374151",
  },
  tagsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "500",
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: "#059669",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  secondaryButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
  infoText: {
    fontSize: 11,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 16,
  },
});