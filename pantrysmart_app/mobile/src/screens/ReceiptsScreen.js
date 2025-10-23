import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { apiService } from "../services/apiService";

export default function ReceiptsScreen({ navigation }) {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadReceipts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Cargar boletas del usuario demo
      const userReceipts = await apiService.receipts.getByUser("demo-user");
      setReceipts(userReceipts);
    } catch (err) {
      console.error('Error loading receipts:', err);
      setError(err);
      // Si no hay boletas, no mostramos error
      if (err.response?.status !== 404) {
        setError("Error al cargar las boletas");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReceipts();
  }, []);

  const onRefresh = () => {
    loadReceipts(true);
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getTotalItems = (receipt) => {
    return receipt.items?.length || 0;
  };

  const renderReceiptItem = ({ item: receipt }) => (
    <TouchableOpacity 
      style={styles.receiptCard}
      onPress={() => navigation.navigate('ReceiptDetail', { receiptId: receipt.id })}
    >
      <View style={styles.receiptHeader}>
        <View style={styles.storeInfo}>
          <MaterialCommunityIcons name="store" size={20} color="#2f7d36" />
          <Text style={styles.storeName}>{receipt.store}</Text>
        </View>
        <Text style={styles.receiptDate}>{formatDate(receipt.date)}</Text>
      </View>

      <View style={styles.receiptStats}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="cart" size={16} color="#6b7280" />
          <Text style={styles.statText}>{getTotalItems(receipt)} productos</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="currency-usd" size={16} color="#6b7280" />
          <Text style={styles.statText}>${receipt.subtotal?.toLocaleString() || '0'}</Text>
        </View>
      </View>

      <View style={styles.receiptFooter}>
        <Text style={styles.receiptTime}>{receipt.time}</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
      </View>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons name="receipt" size={32} color="#2f7d36" />
      </View>
      <Text style={styles.emptyTitle}>No hay boletas guardadas</Text>
      <Text style={styles.emptyText}>
        Escanea tu primera boleta para comenzar a organizar tus compras
      </Text>
      <TouchableOpacity 
        style={styles.scanButton}
        onPress={() => navigation.navigate('Scan')}
      >
        <MaterialCommunityIcons name="camera" size={20} color="#fff" />
        <Text style={styles.scanButtonText}>Escanear boleta</Text>
      </TouchableOpacity>
    </View>
  );

  const ErrorState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: "#fee2e2" }]}>
        <MaterialCommunityIcons name="alert-circle" size={32} color="#dc2626" />
      </View>
      <Text style={styles.emptyTitle}>Error al cargar boletas</Text>
      <Text style={styles.emptyText}>
        Verifica tu conexión e intenta nuevamente
      </Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={() => loadReceipts()}
      >
        <MaterialCommunityIcons name="refresh" size={20} color="#2f7d36" />
        <Text style={styles.retryButtonText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2f7d36" />
        <Text style={styles.loadingText}>Cargando boletas...</Text>
      </View>
    );
  }

  if (error && receipts.length === 0) {
    return <ErrorState />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Boletas</Text>
        <TouchableOpacity 
          style={styles.scanHeaderButton}
          onPress={() => navigation.navigate('Scan')}
        >
          <MaterialCommunityIcons name="camera-plus" size={24} color="#2f7d36" />
        </TouchableOpacity>
      </View>

      {receipts.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={receipts}
          renderItem={renderReceiptItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2f7d36"]}
              tintColor="#2f7d36"
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111",
  },
  scanHeaderButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#ecfdf5",
  },
  listContainer: {
    padding: 16,
  },
  receiptCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  receiptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  storeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  storeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  receiptDate: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  receiptStats: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: "#6b7280",
  },
  receiptFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptTime: {
    fontSize: 12,
    color: "#9ca3af",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ecfdf5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  scanButton: {
    backgroundColor: "#2f7d36",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  retryButton: {
    backgroundColor: "#ecfdf5",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2f7d36",
  },
  retryButtonText: {
    color: "#2f7d36",
    fontSize: 16,
    fontWeight: "600",
  },
});