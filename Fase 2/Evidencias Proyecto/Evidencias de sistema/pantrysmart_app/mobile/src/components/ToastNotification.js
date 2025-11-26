import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function ToastNotification({ 
  visible, 
  message, 
  type = "success", // success, error, info, warning
  duration = 3000,
  onHide 
}) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animación de entrada
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide después del duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, translateY, opacity, duration]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  const getToastConfig = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: "#10b981",
          icon: "check-circle",
          iconColor: "#fff",
        };
      case "error":
        return {
          backgroundColor: "#ef4444",
          icon: "alert-circle",
          iconColor: "#fff",
        };
      case "warning":
        return {
          backgroundColor: "#f59e0b",
          icon: "alert",
          iconColor: "#fff",
        };
      case "info":
        return {
          backgroundColor: "#3b82f6",
          icon: "information",
          iconColor: "#fff",
        };
      default:
        return {
          backgroundColor: "#10b981",
          icon: "check-circle",
          iconColor: "#fff",
        };
    }
  };

  if (!visible) return null;

  const config = getToastConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          transform: [{ translateY }],
          opacity,
        }
      ]}
    >
      <MaterialCommunityIcons 
        name={config.icon} 
        size={20} 
        color={config.iconColor} 
      />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
});