import React, { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const STORAGE_KEY = "@user_lists";

export default function UserListsScreen({ navigation }) {
  const [lists, setLists] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newListName, setNewListName] = useState("");

  useEffect(() => {
    loadLists();
  }, []);

  // Cada vez que vuelves a la pestaña de Listas, recarga desde AsyncStorage
  useFocusEffect(
    useCallback(() => {
      loadLists();
    }, [])
  );

  const loadLists = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) setLists(JSON.parse(data));
      else {
        // Crear lista base si no existe
        const base = [{ id: "base", name: "Mi Lista", items: [] }];
        setLists(base);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(base));
      }
    } catch (e) {
      console.log("Error loading lists", e);
    }
  };

  const saveLists = async (updated) => {
    setLists(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const createList = async () => {
    if (!newListName.trim()) return;

    const newList = {
      id: Date.now().toString(),
      name: newListName.trim(),
      items: [],
    };

    const updated = [...lists, newList];
    await saveLists(updated);

    setNewListName("");
    setShowModal(false);
  };

  const confirmDelete = (list) => {
    if (list.id === "base") {
      Alert.alert("No se puede eliminar", "La lista base no se puede borrar.");
      return;
    }

    Alert.alert(
      "Eliminar lista",
      `¿Eliminar "${list.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => deleteList(list.id),
        },
      ]
    );
  };

  const deleteList = async (id) => {
    const updated = lists.filter((l) => l.id !== id);
    await saveLists(updated);
  };

  const openList = (list) => {
    navigation.navigate("UserListDetail", { listId: list.id });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={lists}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.listCard}
            onPress={() => openList(item)}
            onLongPress={() => confirmDelete(item)}
          >
            <MaterialCommunityIcons
              name="playlist-edit"
              size={22}
              color="#2f7d36"
              style={{ marginRight: 10 }}
            />
            <Text style={styles.listName}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowModal(true)}
      >
        <MaterialCommunityIcons name="plus" size={26} color="#fff" />
      </TouchableOpacity>

      {/* MODAL */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nueva lista</Text>
            <TextInput
              placeholder="Nombre"
              value={newListName}
              onChangeText={setNewListName}
              style={styles.input}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.btn, styles.btnGhost]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.btnGhostText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                onPress={createList}
              >
                <Text style={styles.btnPrimaryText}>Crear</Text>
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
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    marginBottom: 12,
  },
  listName: { fontSize: 16, fontWeight: "600", color: "#111" },

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
    elevation: 5,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    width: "100%",
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
