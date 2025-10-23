import React from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

// Datos mock (luego traer desde Firestore o API)
const RECIPES = [
  {
    id: "1",
    title: "Pasta con tomates cherry y albahaca",
    image:
      "https://images.unsplash.com/photo-1604909053195-d7f2a0ff3a5b?w=800", // demo
    time: "20 min",
    portions: "4 porciones",
    tags: ["Fácil", "vegetariano", "mediterráneo"],
    rating: 4.5,
    availability: 85,
  },
  {
    id: "2",
    title: "Ensalada de quinoa con verduras",
    image:
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
    time: "15 min",
    portions: "2 porciones",
    tags: ["Fácil", "vegano", "saludable"],
    rating: 4.3,
    availability: 92,
  },
  {
    id: "3",
    title: "Pollo al limón con hierbas",
    image:
      "https://images.unsplash.com/photo-1604908176997-6f99f8be3a57?w=800",
    time: "45 min",
    portions: "4 porciones",
    tags: ["Intermedio", "mediterráneo", "horno"],
    rating: 4.7,
    availability: 70,
  },
];

export default function RecipesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Recetas</Text>
      <FlatList
        data={RECIPES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            {/* Imagen */}
            <Image source={{ uri: item.image }} style={styles.image} />

            {/* Contenido */}
            <View style={styles.content}>
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.row}>
                <Text style={styles.meta}>{item.time}</Text>
                <Text style={styles.meta}>• {item.portions}</Text>
              </View>

              {/* Tags */}
              <View style={styles.tags}>
                {item.tags.map((tag, idx) => (
                  <View key={idx} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>

              {/* Barra de disponibilidad */}
              <View style={styles.progressBackground}>
                <View
                  style={[styles.progressBar, { width: `${item.availability}%` }]}
                />
              </View>
              <Text style={styles.availability}>
                Disponibilidad: {item.availability}%
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  header: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: { width: 100, height: 100 },
  content: { flex: 1, padding: 12 },
  title: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  row: { flexDirection: "row", gap: 6, marginBottom: 6 },
  meta: { fontSize: 12, color: "#666" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 6 },
  tag: {
    backgroundColor: "#ecfdf5",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: { fontSize: 11, fontWeight: "500", color: "#059669" },
  progressBackground: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 6,
    marginTop: 4,
    marginBottom: 2,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#059669",
    borderRadius: 6,
  },
  availability: { fontSize: 12, color: "#444" },
});
