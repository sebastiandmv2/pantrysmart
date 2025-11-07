import React from "react";
import { View, TouchableOpacity, Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import RecipesScreen from "../screens/RecipesScreen";
import ListScreen from "../screens/ListScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ScanScreen from "../screens/ScanScreen";
import ReviewScreen from "../screens/ReviewScreen";
import ReceiptsScreen from "../screens/ReceiptsScreen";
import ReceiptDetailScreen from "../screens/ReceiptDetailScreen";
import ReceiptConfirmScreen from "../screens/ReceiptConfirmScreen";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

// Pantalla “vacía” para el tab intermedio (no se muestra; usamos el botón custom)
function Empty() { return null; }

// Botón flotante central (abre Scan del Stack)
function ScanFab() {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("Scan")}
      activeOpacity={0.85}
      style={{
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#2f7d36", // verde
        alignItems: "center",
        justifyContent: "center",
        // posiciona el botón “por encima” de la barra
        top: Platform.OS === "android" ? -22 : -18,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 6,
      }}
    >
      <MaterialCommunityIcons name="camera" size={26} color="#fff" />
    </TouchableOpacity>
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerTitle: "PantrySmart",
        headerTitleAlign: "center",
        headerTitleStyle: { fontSize: 18, fontWeight: "700", color: "#222" },
        headerStyle: { backgroundColor: "#fff" },
        headerShadowVisible: false,          // quita la línea gris del header
        tabBarActiveTintColor: "#2f7d36",
        tabBarInactiveTintColor: "#6b7280",
        tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 8, backgroundColor: "#fff" },
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >

    <Tabs.Screen
      name="Home"
      component={HomeScreen}
      options={{
        title: "PantrySmart", // 👈 cambia el texto del header
        tabBarLabel: "Inicio", // 👈 mantiene "Inicio" en el menú inferior
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="home-variant" size={size} color={color} />
        ),
      }}
    />

      <Tabs.Screen
        name="Recipes"
        component={RecipesScreen}
        options={{
          title: "Recetas",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="book-open-variant" size={size} color={color} />
          ),
        }}
      />

      {/* --- Tab central con botón flotante --- */}
      <Tabs.Screen
        name="ScanFab"
        component={Empty}
        options={{
          title: "",
          tabBarIcon: () => <View />, // no icon (lo sustituye el botón)
          tabBarButton: () => <ScanFab />, // botón personalizado
        }}
        listeners={{
          tabPress: (e) => {
            // evitamos que intente navegar a "Empty"
            e.preventDefault();
          },
        }}
      />

      <Tabs.Screen
        name="Receipts"
        component={ReceiptsScreen}
        options={{
          title: "Boletas",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="receipt" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      {/* Rutas fuera de las tabs */}
      <Stack.Screen name="Scan" component={ScanScreen} options={{ title: "Escanear boleta" }} />
      <Stack.Screen name="Review" component={ReviewScreen} options={{ title: "Revisar productos" }} />
      <Stack.Screen name="List" component={ListScreen} options={{ title: "Lista de compras" }} />
      <Stack.Screen name="ReceiptConfirm" component={ReceiptConfirmScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ReceiptDetail" component={ReceiptDetailScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
