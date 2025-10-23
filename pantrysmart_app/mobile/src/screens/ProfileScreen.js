// src/screens/ProfileScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function ProfileScreen({ navigation }) {
  //  Firestore/Auth o validar con alguna bd para el login real
  const [user] = useState({
    name: "Usuario Demo",
    email: "demo@pantrysmart.app",
  });
  const [notifEnabled, setNotifEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Seguro que quieres salir de tu cuenta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: () => navigation.replace("Login"),
        },
      ]
    );
  };

  const onEditProfile = () => {
    Alert.alert("Editar perfil", "Pantalla de edición (pendiente).");
  };

  const onChangePassword = () => {
    Alert.alert("Cambiar contraseña", "Flujo de cambio (pendiente).");
  };

  const onManageData = () => {
    Alert.alert("Privacidad", "Descargar/Borrar datos (pendiente).");
  };

  const initials =
    user.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <View style={styles.container}>
      {/* Encabezado con avatar e info */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{user.name}</Text>
            <Text style={styles.subtitle}>{user.email}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Acciones principales */}
        <RowButton icon="pencil" label="Editar perfil" onPress={onEditProfile} />
        <RowButton icon="lock-reset" label="Cambiar contraseña" onPress={onChangePassword} />
        <RowSwitch
          icon="bell-outline"
          label="Notificaciones"
          value={notifEnabled}
          onValueChange={setNotifEnabled}
        />
      </View>

      {/* Preferencias/ayuda */}
      <View style={styles.card}>
        <RowButton icon="shield-account-outline" label="Privacidad y datos" onPress={onManageData} />
        <RowButton icon="information-outline" label="Acerca de PantrySmart" onPress={() => Alert.alert("PantrySmart", "v1.0.0 (demo)")} />
        <RowButton icon="help-circle-outline" label="Ayuda" onPress={() => Alert.alert("Ayuda", "Centro de ayuda (pendiente).")} />
      </View>

      {/* Cerrar sesión */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <MaterialCommunityIcons name="logout" size={18} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ---------- Componentes auxiliares ---------- */

function RowButton({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={rowStyles.row} onPress={onPress}>
      <View style={rowStyles.left}>
        <View style={rowStyles.iconWrap}>
          <MaterialCommunityIcons name={icon} size={18} color="#2f7d36" />
        </View>
        <Text style={rowStyles.label}>{label}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color="#9ca3af" />
    </TouchableOpacity>
  );
}

function RowSwitch({ icon, label, value, onValueChange }) {
  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.left}>
        <View style={rowStyles.iconWrap}>
          <MaterialCommunityIcons name={icon} size={18} color="#2f7d36" />
        </View>
        <Text style={rowStyles.label}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#d1d5db", true: "#a7f3d0" }}
        thumbColor={value ? "#2f7d36" : "#f4f3f4"}
      />
    </View>
  );
}

/* ------------------- Estilos ------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16, gap: 16 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
  },

  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#eaf7ee",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#2f7d36", fontWeight: "800", fontSize: 18 },

  title: { fontSize: 18, fontWeight: "700" },
  subtitle: { color: "#6b7280", marginTop: 2 },

  divider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 12 },

  logoutBtn: {
    backgroundColor: "#2f7d36",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  logoutText: { color: "#fff", fontWeight: "700" },
});

const rowStyles = StyleSheet.create({
  row: {
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#eaf7ee",
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 14, fontWeight: "600" },
});
