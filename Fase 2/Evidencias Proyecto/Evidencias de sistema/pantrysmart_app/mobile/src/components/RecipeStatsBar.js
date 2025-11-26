import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function RecipeStatsBar({ 
  totalRecipes, 
  traditionalCount, 
  aiCount, 
  onShowAIStats 
}) {
  if (totalRecipes === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="book-open-variant" size={16} color="#059669" />
          <Text style={styles.statValue}>{totalRecipes}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        
        <View style={styles.stat}>
          <MaterialCommunityIcons name="chef-hat" size={16} color="#f59e0b" />
          <Text style={styles.statValue}>{traditionalCount}</Text>
          <Text style={styles.statLabel}>Chilenas</Text>
        </View>
        
        <View style={styles.stat}>
          <MaterialCommunityIcons name="robot" size={16} color="#8b5cf6" />
          <Text style={styles.statValue}>{aiCount}</Text>
          <Text style={styles.statLabel}>IA</Text>
        </View>
        
        {aiCount > 0 && (
          <TouchableOpacity style={styles.aiStatsButton} onPress={onShowAIStats}>
            <MaterialCommunityIcons name="chart-line" size={14} color="#8b5cf6" />
            <Text style={styles.aiStatsButtonText}>Stats IA</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  stat: {
    alignItems: "center",
    flex: 1,
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  statLabel: {
    fontSize: 10,
    color: "#6b7280",
    fontWeight: "500",
  },
  aiStatsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  aiStatsButtonText: {
    fontSize: 10,
    color: "#8b5cf6",
    fontWeight: "600",
  },
});