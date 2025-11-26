import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function LoginScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Logo o título */}
      <Text style={styles.logo}>PantrySmart</Text>

      {/* Encabezado */}
      <Text style={styles.header}>Iniciar sesión</Text>
      <Text style={styles.subtitle}>Ingresa a tu cuenta para continuar</Text>

      {/* Input correo */}
      <View style={styles.inputContainer}>
        <MaterialCommunityIcons
          name="email-outline"
          size={20}
          color="#666"
          style={styles.inputIcon}
        />
        <TextInput
          placeholder="Correo electrónico"
          style={styles.input}
          keyboardType="email-address"
        />
      </View>

      {/* Input contraseña */}
      <View style={styles.inputContainer}>
        <MaterialCommunityIcons
          name="lock-outline"
          size={20}
          color="#666"
          style={styles.inputIcon}
        />
        <TextInput
          placeholder="Contraseña"
          secureTextEntry
          style={styles.input}
        />
        <MaterialCommunityIcons
          name="eye-outline"
          size={20}
          color="#666"
          style={styles.inputIconRight}
        />
      </View>

      {/* Link olvidaste contraseña */}
      <TouchableOpacity style={{ alignSelf: "flex-end", marginBottom: 16 }}>
        <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      {/* Botón iniciar sesión */}
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => navigation.replace("MainTabs")}
      >
        <Text style={styles.primaryBtnText}>Iniciar sesión</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>o continúa con</Text>
        <View style={styles.line} />
      </View>

      {/* Botón Google */}
      <TouchableOpacity style={styles.googleBtn}>
        <MaterialCommunityIcons
          name="google"
          size={20}
          color="#000"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.googleBtnText}>Continuar con Google</Text>
      </TouchableOpacity>

      {/* Crear cuenta */}
      <TouchableOpacity style={{ marginTop: 20, alignSelf: "center" }}>
        <Text style={styles.link}>
          ¿No tienes cuenta? <Text style={{ fontWeight: "bold" }}>Crear cuenta</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  logo: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "left",
    color: "#166534", // verde oscuro
    marginBottom: 40,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "left",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    height: 44,
  },
  inputIcon: {
    marginRight: 6,
  },
  inputIconRight: {
    marginLeft: 6,
  },
  link: {
    fontSize: 14,
    color: "#166534",
  },
  primaryBtn: {
    backgroundColor: "#166534",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#666",
    fontSize: 14,
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingVertical: 12,
    justifyContent: "center",
  },
  googleBtnText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
