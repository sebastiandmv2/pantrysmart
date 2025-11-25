import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const STORAGE_KEY = "@user_lists";

export default function UserListDetailScreen({ route, navigation }) {
  const { listId } = route.params;
  const [lists, setLists] = useState([]);
  const [list, setList] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [itemName, setItemName] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);

      if (!data) {
        setLists([]);
        setList(null);
        navigation.setOptions({ title: "Lista" });
        return;
      }

      const parsed = JSON.parse(data);
      setLists(parsed);

      const found = parsed.find((l) => l.id === listId) || null;
      setList(found);

      if (found) {
        navigation.setOptions({ title: found.name });
      } else {
        navigation.setOptions({ title: "Lista" });
      }
    } catch (e) {
      console.log("Error loading list detail", e);
    }
  };

  const save = async (updatedLists) => {
    setLists(updatedLists);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLists));
  };

  const getItemQuantity = (item) => {
    if (typeof item.quantity === "number" && item.quantity > 0) {
      return item.quantity;
    }
    return 1;
  };

  const toggleItem = (id) => {
    if (!list) return;

    const updated = lists.map((l) =>
      l.id === list.id
        ? {
            ...l,
            items: l.items.map((it) =>
              it.id === id ? { ...it, done: !it.done } : it
            ),
          }
        : l
    );
    save(updated);
    load();
  };

  const deleteItem = (id) => {
    if (!list) return;

    const updated = lists.map((l) =>
      l.id === list.id
        ? { ...l, items: l.items.filter((it) => it.id !== id) }
        : l
    );
    save(updated);
    load();
  };

  const changeQuantity = (id, delta) => {
    if (!list) return;

    const updated = lists.map((l) => {
      if (l.id !== list.id) return l;

      const newItems = l.items
        .map((it) => {
          if (it.id !== id) return it;

          const currentQty = getItemQuantity(it);
          const newQty = currentQty + delta;

          // Si llega a 0 o menos, eliminamos el item
          if (newQty <= 0) {
            return null;
          }

          return { ...it, quantity: newQty };
        })
        .filter(Boolean);

      return { ...l, items: newItems };
    });

    save(updated);
    load();
  };

  const addItem = () => {
    if (!itemName.trim() || !list) return;

    const newItem = {
      id: Date.now().toString(),
      name: itemName.trim(),
      done: false,
      quantity: 1, // 👈 por defecto 1 unidad
    };

    const updated = lists.map((l) =>
      l.id === list.id ? { ...l, items: [...l.items, newItem] } : l
    );

    save(updated);
    setShowAdd(false);
    setItemName("");
    load();
  };

  const deleteList = () => {
    if (!list) {
      Alert.alert(
        "Lista no encontrada",
        "Esta lista ya no existe o no se pudo cargar."
      );
      return;
    }

    if (list.id === "base") {
      Alert.alert("No se puede eliminar", "La lista base no se puede borrar.");
      return;
    }

    Alert.alert("Eliminar lista", `¿Eliminar "${list.name}" completa?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          const updated = lists.filter((l) => l.id !== list.id);
          await save(updated);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={list?.items || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }} // 👈 espacio extra abajo
        renderItem={({ item }) => {
          const qty = getItemQuantity(item);
          return (
            <View style={styles.row}>
              {/* Checkbox */}
              <TouchableOpacity onPress={() => toggleItem(item.id)}>
                <MaterialCommunityIcons
                  name={
                    item.done
                      ? "check-circle"
                      : "checkbox-blank-circle-outline"
                  }
                  color={item.done ? "#2f7d36" : "#9ca3af"}
                  size={22}
                />
              </TouchableOpacity>

              {/* Nombre producto */}
              <View style={styles.itemInfo}>
                <Text
                  style={[
                    styles.itemName,
                    item.done && {
                      textDecorationLine: "line-through",
                      color: "#9ca3af",
                    },
                  ]}
                >
                  {item.name}
                </Text>
                <Text style={styles.itemQuantityText}>Unidades: {qty}</Text>
              </View>

              {/* Controles de cantidad + basura */}
              <View style={styles.rowRight}>
                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    style={[
                      styles.qtyButton,
                      qty <= 1 && styles.qtyButtonDanger,
                    ]}
                    onPress={() => changeQuantity(item.id, -1)}
                  >
                    <MaterialCommunityIcons
                      name="minus"
                      size={16}
                      color={qty <= 1 ? "#dc2626" : "#374151"}
                    />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{qty}</Text>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => changeQuantity(item.id, 1)}
                  >
                    <MaterialCommunityIcons
                      name="plus"
                      size={16}
                      color="#374151"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => deleteItem(item.id)}>
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={20}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* AGREGAR ITEM */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)}>
        <MaterialCommunityIcons name="plus" size={26} color="#fff" />
      </TouchableOpacity>

      {/* ELIMINAR LISTA */}
      <TouchableOpacity style={styles.deleteListBtn} onPress={deleteList}>
        <MaterialCommunityIcons name="trash-can" size={20} color="#fff" />
        <Text style={{ color: "#fff", fontWeight: "700", marginLeft: 6 }}>
          Eliminar lista
        </Text>
      </TouchableOpacity>

      {/* MODAL ITEM */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Agregar item</Text>
            <TextInput
              placeholder="Nombre del item"
              value={itemName}
              onChangeText={setItemName}
              style={styles.input}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.btn, styles.btnGhost]}
                onPress={() => setShowAdd(false)}
              >
                <Text style={styles.btnGhostText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                onPress={addItem}
              >
                <Text style={styles.btnPrimaryText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 12,
  },

  itemInfo: {
    flex: 1,
  },

  itemName: { fontSize: 16, fontWeight: "600", color: "#111" },

  itemQuantityText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },

  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginRight: 4,
  },

  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
  },

  qtyButtonDanger: {
    borderColor: "#fecaca",
    backgroundColor: "#fee2e2",
  },

  qtyText: {
    minWidth: 20,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2f7d36",
    alignItems: "center",
    justifyContent: "center",
  },

  deleteListBtn: {
    position: "absolute",
    left: 20,
    bottom: 24,
    backgroundColor: "#dc2626",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    padding: 16,
  },

  modalCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
  },

  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },

  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 10,
    fontSize: 14,
  },

  modalButtons: {
    flexDirection: "row",
    marginTop: 20,
    gap: 10,
  },

  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnGhost: { backgroundColor: "#f3f4f6" },
  btnGhostText: { fontWeight: "600", color: "#111" },
  btnPrimary: { backgroundColor: "#2f7d36" },
  btnPrimaryText: { fontWeight: "700", color: "#fff" },
});
