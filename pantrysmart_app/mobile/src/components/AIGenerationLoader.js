// pantrysmart_app/mobile/src/components/AIGenerationLoader.js

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import VeggieCatchMiniGame from "./VeggieCatchMiniGame";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function AIGenerationLoader({
  isLoading,
  isRetrying,
  retryCount,
  onCancel,
  generationStep = "Generando recetas con IA...",
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) {
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

      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

      rotateAnimation.start();

      return () => {
        rotateAnimation.stop();
      };
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading, fadeAnim, scaleAnim, rotateAnim]);

  if (!isLoading) return null;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const getLoadingMessage = () => {
    if (isRetrying && retryCount > 0) {
      return `Reintentando... (${retryCount}/3)`;
    }
    return generationStep;
  };

  const getLoadingSubtext = () => {
    if (isRetrying) {
      return "La IA está trabajando en tu solicitud";
    }
    return "Esto puede tomar hasta 30 segundos";
  };

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Cabecera del mini-juego */}
        <View style={styles.gameHeader}>
          <Animated.View
            style={[
              styles.robotAvatar,
              {
                transform: [{ rotate: spin }],
              },
            ]}
          >
            <MaterialCommunityIcons name="robot" size={24} color="#fff" />
          </Animated.View>
          <Text style={styles.gameTitle}>Mini-juego: atrapa las verduras</Text>
        </View>

        {/* Mini-juego (forzado a ocupar todo el ancho) */}
        <View style={styles.gameWrapper}>
          <VeggieCatchMiniGame />
        </View>

        {/* Mensaje principal */}
        <Text style={styles.title}>{getLoadingMessage()}</Text>
        <Text style={styles.subtitle}>{getLoadingSubtext()}</Text>

        {/* Indicador de progreso si está reintentando */}
        {isRetrying && retryCount > 0 && (
          <View style={styles.retryIndicator}>
            <View className="progressBar" style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(retryCount / 3) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.retryText}>Intento {retryCount} de 3</Text>
          </View>
        )}

        {/* Botón de cancelar */}
        {onCancel && (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        )}

        {/* Tips mientras espera */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Mientras esperas:</Text>
          <Text style={styles.tipText}>• La IA está analizando tu inventario</Text>
          <Text style={styles.tipText}>• Creando recetas personalizadas</Text>
          <Text style={styles.tipText}>
            • Calculando disponibilidad de ingredientes
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    margin: 20,
    alignItems: "center",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },

  // --- NUEVO: estilos para el mini-juego ---
  gameHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    alignSelf: "stretch",
  },
  robotAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  gameTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#047857",
  },
  gameWrapper: {
    alignSelf: "stretch",   // 👈 fuerza al mini-juego a ocupar todo el ancho del card
    marginBottom: 16,
  },
  // -----------------------------------------

  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 20,
  },
  retryIndicator: {
    width: "100%",
    marginBottom: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: 6,
    backgroundColor: "#f59e0b",
    borderRadius: 3,
  },
  retryText: {
    fontSize: 12,
    color: "#f59e0b",
    textAlign: "center",
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 20,
  },
  cancelButtonText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "600",
  },
  tipsContainer: {
    alignSelf: "stretch",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
    lineHeight: 16,
  },
});
