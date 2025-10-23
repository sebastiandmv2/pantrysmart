import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useHealthCheck } from "../hooks/useApi";

const MISSING_TAGS = ["Leche 0L / 1L", "Huevos 0 / 12", "Arroz 150g / 500g"];

const CATEGORIES = [
  { id: "lacteos", name: "Lácteos", count: 8, icon: "bottle-soda" },
  { id: "verduras", name: "Verduras", count: 12, icon: "sprout" },
  { id: "despensa", name: "Despensa", count: 24, icon: "package-variant-closed" },
  { id: "carnes", name: "Carnes", count: 6, icon: "food-drumstick" },
  { id: "bebidas", name: "Bebidas", count: 15, icon: "cup-water" },
];

const RECENT_PRODUCTS = [
  { id: "1", name: "Tomates cherry", note: "500g • $1.990 • hace 2 días", level: "alto" },
  { id: "2", name: "Queso mantecoso", note: "200g • $2.890 • hace 2 días", level: "alto" },
  { id: "3", name: "Aceite de oliva", note: "500ml • $3.490 • hace 1 semana", level: "medio" },
  { id: "4", name: "Arroz integral", note: "1kg • $1.270 • hace 3 semanas", level: "bajo" },
];

export default function HomeScreen({ navigation }) {
  const { data: healthData, loading: healthLoading, error: healthError } = useHealthCheck();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 28 }}>
      {/* Estado de conexión con API */}
      <View style={styles.connectionStatus}>
        <MaterialCommunityIcons 
          name={healthError ? "wifi-off" : "wifi"} 
          size={16} 
          color={healthError ? "#dc2626" : "#059669"} 
        />
        <Text style={[styles.connectionText, { color: healthError ? "#dc2626" : "#059669" }]}>
          {healthLoading ? "Conectando..." : healthError ? "Sin conexión" : "Conectado a API"}
        </Text>
      </View>

      {/* Encabezado */}
      <Text style={styles.greeting}>Hola, Usuario 👋</Text>
      <Text style={styles.subtitle}>Tienes 24 productos en tu despensa</Text>

      {/* Acciones */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionPrimary]}
          onPress={() => navigation.navigate("Scan")}
        >
          <MaterialCommunityIcons
            name="camera"
            size={18}
            color="#fff"
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.actionText, { color: "#fff" }]}>Escanear boleta</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <MaterialCommunityIcons
            name="plus"
            size={18}
            color="#111"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.actionText}>Añadir producto</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn}>
          <MaterialCommunityIcons
            name="calendar-month"
            size={18}
            color="#111"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.actionText}>Plan semanal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("Receipts")}
        >
          <MaterialCommunityIcons
            name="receipt"
            size={18}
            color="#111"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.actionText}>Mis boletas</Text>
        </TouchableOpacity>
      </View>

      {/* KPIs */}
      <View style={styles.infoRow}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Faltantes</Text>
          <Text style={styles.infoValue}>3 productos</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Ahorro semanal</Text>
          <Text style={styles.infoValue}>$12.450</Text>
        </View>
      </View>

      {/* ======  Productos faltantes ====== */}
      <Section title="Productos faltantes" subtitle="para tus recetas y plan semanal" badge="3">
        <View style={styles.chipsRow}>
          {MISSING_TAGS.map((t) => (
            <Chip key={t} text={t} />
          ))}
        </View>

        <View style={styles.row}>
          {/* Botón Agregar a lista */}
          <TouchableOpacity
            style={[styles.ctaBtn, styles.ctaPrimary]}
            onPress={() => navigation.navigate("List")} // 👈 Navega a ListScreen
          >
            <MaterialCommunityIcons
              name="cart-plus"
              color="#fff"
              size={18}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.ctaText, { color: "#fff" }]}>Agregar a lista</Text>
          </TouchableOpacity>

          {/* Botón Ver detalles */}
          <TouchableOpacity style={[styles.ctaBtn, styles.ctaGhost]}>
            <MaterialCommunityIcons
              name="eye-outline"
              color="#111"
              size={18}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.ctaText}>Ver detalles</Text>
          </TouchableOpacity>
        </View>
      </Section>

      {/* ======  Inventario por categoría ====== */}
      <Section title="Inventario por categoría">
        <View style={styles.categoriesGrid}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity key={c.id} style={styles.catCard}>
              <View style={[styles.catIconWrap]}>
                <MaterialCommunityIcons name={c.icon} size={18} color="#2f7d36" />
              </View>
              <View>
                <Text style={styles.catName}>{c.name}</Text>
                <Text style={styles.catCount}>{c.count} productos</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Section>

      {/* ======  Productos recientes ====== */}
      <Section title="Productos recientes">
        <FlatList
          data={RECENT_PRODUCTS}
          keyExtractor={(i) => i.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <View style={styles.recentRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.recentName}>{item.name}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <Badge level={item.level} />
                  <Text style={styles.recentNote}>{item.note}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.plusBtn}>
                <MaterialCommunityIcons name="plus" size={18} color="#111" />
              </TouchableOpacity>
            </View>
          )}
        />
      </Section>
    </ScrollView>
  );
}

/* =============== Componentes UI locales =============== */

function Section({ title, subtitle, badge, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function Chip({ text }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );
}

function Badge({ level }) {
  const map = {
    alto: { bg: "#dcfce7", fg: "#166534", text: "alto" },
    medio: { bg: "#fef9c3", fg: "#854d0e", text: "medio" },
    bajo: { bg: "#fee2e2", fg: "#991b1b", text: "bajo" },
  };
  const c = map[level] || map.alto;
  return (
    <View style={[styles.levelBadge, { backgroundColor: c.bg }]}>
      <Text style={[styles.levelBadgeText, { color: c.fg }]}>{c.text}</Text>
    </View>
  );
}

/* ===================== Estilos ===================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },

  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  connectionText: {
    fontSize: 12,
    fontWeight: "600",
  },

  greeting: { fontSize: 22, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#555", marginBottom: 16 },

  actionsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  actionBtn: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
    flexDirection: "row",
  },
  actionPrimary: { backgroundColor: "#2f7d36" },
  actionText: { color: "#000", fontWeight: "600", fontSize: 14 },

  infoRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, gap: 12 },
  infoCard: {
    flex: 1,
    backgroundColor: "#ecfdf5",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  infoLabel: { fontSize: 14, color: "#555", marginBottom: 6 },
  infoValue: { fontSize: 18, fontWeight: "700", color: "#059669" },

  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
    marginTop: 16,
  },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  sectionSubtitle: { color: "#6b7280", marginTop: 2 },

  badge: {
    backgroundColor: "#e5f5eb",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#b7e4ca",
  },
  badgeText: { color: "#2f7d36", fontWeight: "700", fontSize: 12 },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  chip: {
    backgroundColor: "#eef2f7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  chipText: { color: "#111", fontWeight: "600", fontSize: 12 },

  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    flex: 1,
  },
  ctaPrimary: { backgroundColor: "#2f7d36" },
  ctaGhost: { backgroundColor: "#f3f4f6" },
  ctaText: { fontWeight: "700" },

  categoriesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  catCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    minWidth: "47%",
  },
  catIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#eaf7ee",
    alignItems: "center",
    justifyContent: "center",
  },
  catName: { fontWeight: "700" },
  catCount: { color: "#6b7280", fontSize: 12 },

  recentRow: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  recentName: { fontWeight: "700" },
  recentNote: { color: "#6b7280", fontSize: 12 },
  levelBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  levelBadgeText: { fontSize: 11, fontWeight: "700" },
  plusBtn: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
  },
});
