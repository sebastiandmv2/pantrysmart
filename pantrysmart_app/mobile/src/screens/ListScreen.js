import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const INITIAL = [
  { id: "1", name: "Leche entera 1L", qty: 1, category: "Lácteos", done: false },
  { id: "2", name: "Huevos (12u)", qty: 1, category: "Despensa", done: false },
  { id: "3", name: "Arroz 1kg", qty: 1, category: "Despensa", done: false },
];

export default function ListScreen() {
  const [items, setItems] = useState(INITIAL);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [category, setCategory] = useState("General");

  const grouped = useMemo(() => {
    const map = new Map();
    items.forEach((it) => {
      if (!map.has(it.category)) map.set(it.category, []);
      map.get(it.category).push(it);
    });
    return Array.from(map.entries()); // [ [category, items[]], ... ]
  }, [items]);

  const toggleDone = (id) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, done: !it.done } : it))
    );
  };

  const inc = (id) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, qty: it.qty + 1 } : it)));

  const dec = (id) =>
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, qty: Math.max(1, it.qty - 1) } : it
      )
    );

  const remove = (id) => setItems((prev) => prev.filter((it) => it.id !== id));

  const addItem = () => {
    const q = parseInt(qty || "1", 10);
    if (!name.trim() || Number.isNaN(q) || q <= 0) return;
    setItems((prev) => [
      ...prev,
      { id: String(Date.now()), name: name.trim(), qty: q, category: category.trim() || "General", done: false },
    ]);
    setShowAdd(false);
    setName("");
    setQty("1");
    setCategory("General");
  };

  const Empty = () => (
    <View style={{ alignItems: "center", marginTop: 50 }}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons name="cart-outline" size={28} color="#2f7d36" />
      </View>
      <Text style={styles.emptyTitle}>Lista de compras inteligente</Text>
      <Text style={styles.emptyText}>Aquí verás tu lista organizada por categorías y tiendas.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Lista por categorías */}
      {items.length === 0 ? (
        <Empty />
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          data={grouped}
          keyExtractor={([cat]) => cat}
          renderItem={({ item: [cat, rows] }) => (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{cat}</Text>
              {rows.map((it) => (
                <View key={it.id} style={styles.row}>
                  <TouchableOpacity onPress={() => toggleDone(it.id)} style={styles.checkbox}>
                    {it.done ? (
                      <MaterialCommunityIcons name="check-circle" size={22} color="#2f7d36" />
                    ) : (
                      <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={22} color="#9ca3af" />
                    )}
                  </TouchableOpacity>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, it.done && { textDecorationLine: "line-through", color: "#9ca3af" }]}>{it.name}</Text>
                    <Text style={styles.itemSub}>x{it.qty}</Text>
                  </View>

                  <View style={styles.qtyBox}>
                    <TouchableOpacity onPress={() => dec(it.id)} style={styles.qtyBtn}>
                      <MaterialCommunityIcons name="minus" size={18} color="#111" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{it.qty}</Text>
                    <TouchableOpacity onPress={() => inc(it.id)} style={styles.qtyBtn}>
                      <MaterialCommunityIcons name="plus" size={18} color="#111" />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity onPress={() => remove(it.id)} style={styles.deleteBtn}>
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)}>
        <MaterialCommunityIcons name="plus" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Modal agregar producto */}
      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Agregar producto</Text>

            <View style={styles.inputWrap}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                placeholder="Ej: Tomates cherry 500g"
                value={name}
                onChangeText={setName}
                style={styles.input}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputWrap, { flex: 1 }]}>
                <Text style={styles.label}>Cantidad</Text>
                <TextInput
                  placeholder="1"
                  keyboardType="number-pad"
                  value={qty}
                  onChangeText={setQty}
                  style={styles.input}
                />
              </View>

              <View style={[styles.inputWrap, { flex: 1 }]}>
                <Text style={styles.label}>Categoría</Text>
                <TextInput
                  placeholder="Despensa"
                  value={category}
                  onChangeText={setCategory}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              <TouchableOpacity style={[styles.modalBtn, styles.btnGhost]} onPress={() => setShowAdd(false)}>
                <Text style={styles.btnGhostText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.btnPrimary]} onPress={addItem}>
                <MaterialCommunityIcons name="cart-plus" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={{ color: "#fff", fontWeight: "700" }}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

/* =================== estilos =================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  /* empty */
  emptyIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#eaf7ee", alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { marginTop: 12, fontWeight: "700", fontSize: 16 },
  emptyText: { color: "#6b7280", marginTop: 4 },

  /* section */
  section: { paddingHorizontal: 16, paddingTop: 14 },
  sectionTitle: { fontWeight: "700", marginBottom: 8, fontSize: 16 },

  /* row item */
  row: {
    backgroundColor: "#fff",
    borderWidth: 1, borderColor: "#e5e7eb",
    paddingVertical: 12, paddingHorizontal: 12,
    borderRadius: 14, flexDirection: "row", alignItems: "center", marginBottom: 10,
  },
  checkbox: { marginRight: 10 },
  itemName: { fontWeight: "700" },
  itemSub: { color: "#6b7280", fontSize: 12 },

  qtyBox: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 6, paddingVertical: 3,
    marginRight: 6,
  },
  qtyBtn: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#f3f4f6" },
  qtyText: { width: 22, textAlign: "center", fontWeight: "700" },

  deleteBtn: {
    width: 32, height: 32, alignItems: "center", justifyContent: "center",
    borderRadius: 8, backgroundColor: "#f9fafb",
  },

  /* fab */
  fab: {
    position: "absolute",
    right: 20, bottom: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#2f7d36",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },

  /* modal */
  modalWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  inputWrap: { marginTop: 8 },
  rowInputs: { flexDirection: "row", gap: 10 },
  label: { fontSize: 12, color: "#6b7280", marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
    backgroundColor: "#fff",
  },
  modalBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 12, borderRadius: 12,
  },
  btnGhost: { backgroundColor: "#f3f4f6" },
  btnGhostText: { color: "#111", fontWeight: "700" },
  btnPrimary: { backgroundColor: "#2f7d36" },
});
