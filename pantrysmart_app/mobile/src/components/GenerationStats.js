import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function GenerationStats({ 
  generationTime, 
  userInventoryItems, 
  retryCount,
  onShowDetails 
}) {
  if (!generationTime && !userInventoryItems && retryCount === 0) {
    return null;
  }

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onShowDetails}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <MaterialCommunityIcons name="chart-line" size={16} color="#059669" />
        <Text style={styles.title}>Estadísticas de generación</Text>
        <MaterialCommunityIcons name="chevron-right" size={16} color="#6b7280" />
      </View>
      
      <View style={styles.statsRow}>
        {generationTime && (
          <View style={styles.stat}>
            <MaterialCommunityIcons name="clock-outline" size={14} color="#6b7280" />
            <Text style={styles.statValue}>{generationTime}s</Text>
            <Text style={styles.statLabel}>Tiempo</Text>
          </View>
        )}
        
        {userInventoryItems !== undefined && (
          <View style={styles.stat}>
            <MaterialCommunityIcons name="package-variant" size={14} color="#6b7280" />
            <Text style={styles.statValue}>{userInventoryItems}</Text>
            <Text style={styles.statLabel}>Items analizados</Text>
          </View>
        )}
        
        {retryCount > 0 && (
          <View style={styles.stat}>
            <MaterialCommunityIcons name="refresh" size={14} color="#f59e0b" />
            <Text style={[styles.statValue, { color: "#f59e0b" }]}>{retryCount}</Text>
            <Text style={styles.statLabel}>Reintentos</Text>
          </View>
        )}
        
        <View style={styles.stat}>
          <MaterialCommunityIcons name="robot" size={14} color="#8b5cf6" />
          <Text style={[styles.statValue, { color: "#8b5cf6" }]}>IA</Text>
          <Text style={styles.statLabel}>Generado por</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    margin: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 8,
  },
  stat: {
    alignItems: "center",
    flex: 1,
    gap: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
  },
  statLabel: {
    fontSize: 10,
    color: "#6b7280",
    textAlign: "center",
  },
});