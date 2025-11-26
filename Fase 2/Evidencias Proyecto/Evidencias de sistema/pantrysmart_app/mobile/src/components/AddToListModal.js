// src/components/AddToListModal.js
import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getLists } from "../services/userLists";

export default function AddToListModal({
  visible,
  onClose,
  onConfirm,
  hasMissing = false,
  allowAllOption = true,
}) {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedListId, setSelectedListId] = useState(null);
  const [mode, setMode] = useState(
    hasMissing && allowAllOption ? "missing" : "all"
  );

  useEffect(() => {
    if (!visible) return;
    loadLists();
  }, [visible]);

  useEffect(() => {
    if (hasMissing && allowAllOption) {
      setMode("missing");
    } else {
      setMode("all");
    }
  }, [hasMissing, allowAllOption]);

  const loadLists = async () => {
    try {
      setLoading(true);
      const data = await getLists();
      setLists(data);
      if (data.length > 0) {
        setSelectedListId(data[0].id);
      }
    } catch (error) {
      console.error("Error loading lists in AddToListModal:", error);
      Alert.alert("Error", "No se pudieron cargar tus listas.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedListId) {
      Alert.alert("Selecciona una lista", "Debes elegir una lista de destino.");
      return;
    }
    if (!onConfirm) return;
    onConfirm({ listId: selectedListId, mode });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Agregar a lista</Text>
          <Text style={styles.subtitle}>
            Elige qué agregar y a qué lista de compras guardar.
          </Text>

          {/* Qué agregar */}
          <View style={styles.section}>
            {hasMissing && (
              <TouchableOpacity
                style={[
                  styles.optionRow,
                  mode === "missing" && styles.optionRowSelected,
                ]}
                onPress={() => setMode("missing")}
              >
                <MaterialCommunityIcons
                  name={
                    mode === "missing" ? "radiobox-marked" : "radiobox-blank"
                  }
                  size={20}
                  color={mode === "missing" ? "#059669" : "#6b7280"}
                />
                <View style={styles.optionTextWrap}>
                  <Text style={styles.optionTitle}>Sólo faltantes</Text>
                  <Text style={styles.optionSubtitle}>
                    Añade sólo los ingredientes que no tienes.
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {allowAllOption && (
              <TouchableOpacity
                style={[
                  styles.optionRow,
                  mode === "all" && styles.optionRowSelected,
                ]}
                onPress={() => setMode("all")}
              >
                <MaterialCommunityIcons
                  name={
                    mode === "all" ? "radiobox-marked" : "radiobox-blank"
                  }
                  size={20}
                  color={mode === "all" ? "#059669" : "#6b7280"}
                />
                <View style={styles.optionTextWrap}>
                  <Text style={styles.optionTitle}>Todos los ingredientes</Text>
                  <Text style={styles.optionSubtitle}>
                    Usa la lista como checklist completa de la receta.
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Listas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mis listas</Text>

            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#059669" />
                <Text style={styles.loadingText}>Cargando listas...</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 200 }}>
                {lists.map((list) => (
                  <TouchableOpacity
                    key={list.id}
                    style={[
                      styles.listRow,
                      selectedListId === list.id && styles.listRowSelected,
                    ]}
                    onPress={() => setSelectedListId(list.id)}
                  >
                    <View style={styles.listIcon}>
                      <MaterialCommunityIcons
                        name="format-list-checks"
                        size={18}
                        color={
                          selectedListId === list.id ? "#fff" : "#059669"
                        }
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.listName,
                          selectedListId === list.id &&
                            styles.listNameSelected,
                        ]}
                      >
                        {list.name}
                      </Text>
                      <Text style={styles.listSubtitle}>
                        {Array.isArray(list.items)
                          ? `${list.items.length} ítems`
                          : "0 ítems"}
                      </Text>
                    </View>
                    {selectedListId === list.id && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={20}
                        color="#059669"
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Botones */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnGhost]}
              onPress={onClose}
            >
              <Text style={styles.btnGhostText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={handleConfirm}
            >
              <Text style={styles.btnPrimaryText}>Agregar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 12,
  },
  section: {
    marginTop: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    gap: 8,
  },
  optionRowSelected: {
    backgroundColor: "#ecfdf5",
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  optionSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
  },
  loadingText: {
    fontSize: 13,
    color: "#6b7280",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  listRowSelected: {
    borderColor: "#059669",
    backgroundColor: "#ecfdf5",
  },
  listIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  listName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  listNameSelected: {
    color: "#065f46",
  },
  listSubtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  buttonsRow: {
    flexDirection: "row",
    marginTop: 14,
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  btnGhost: {
    backgroundColor: "#f3f4f6",
  },
  btnGhostText: {
    fontWeight: "600",
    color: "#111827",
  },
  btnPrimary: {
    backgroundColor: "#059669",
  },
  btnPrimaryText: {
    fontWeight: "700",
    color: "#fff",
  },
});
