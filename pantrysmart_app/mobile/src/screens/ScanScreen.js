// src/screens/ScanScreen.js
import React, { useRef, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useReceiptScan } from "../hooks/useReceiptScan";
import { apiService } from "../services/apiService";

export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const { loading, error, extractReceipt } = useReceiptScan();

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <MaterialCommunityIcons 
            name="camera" 
            size={80} 
            color="#2f7d36" 
            style={styles.permissionIcon}
          />
          <Text style={styles.permissionTitle}>Acceso a la Cámara</Text>
          <Text style={styles.permissionMessage}>
            Necesitamos acceso a la cámara para escanear tus boletas y agregar productos automáticamente
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton} 
            onPress={requestPermission}
          >
            <MaterialCommunityIcons name="camera-plus" size={20} color="#fff" />
            <Text style={styles.permissionButtonText}>Conceder Permiso</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleCapture = async () => {
    try {
      setCapturing(true);
      setProcessingStep("Capturando imagen...");
      
      // Tomar la foto
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });
      
      if (!photo?.uri) {
        Alert.alert("Error", "No se pudo capturar la imagen");
        return;
      }

      console.log('Photo captured:', photo.uri);
      setProcessingStep("Preparando imagen...");

      // Preparar archivo para envío
      const imageFile = {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'receipt.jpg',
      };

      console.log('Sending image to API...');
      setProcessingStep("Enviando al servidor...");
      
      // Primero probar el debug upload
      try {
        const debugResult = await apiService.receipts.debugUpload(imageFile);
        console.log('Debug upload result:', debugResult);
      } catch (debugErr) {
        console.error('Debug upload failed:', debugErr);
      }
      
      setProcessingStep("Analizando boleta con IA...");
      
      // Extraer datos de la boleta usando IA
      const extractedData = await extractReceipt(imageFile);
      
      console.log('Extracted data:', extractedData);
      setProcessingStep("¡Listo! Redirigiendo...");
      
      // Pequeña pausa para mostrar el mensaje de éxito
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Navegar a la pantalla de confirmación con los datos extraídos
      navigation.navigate("ReceiptConfirm", { 
        extractedData: extractedData 
      });

    } catch (err) {
      console.error('Error processing receipt:', err);
      
      // Mostrar error más específico
      let errorMessage = "No se pudo procesar la boleta.";
      if (err.response?.status === 422) {
        errorMessage = "Error en el formato de la imagen. Intente tomar otra foto.";
      } else if (err.response?.status === 500) {
        errorMessage = "Error del servidor. Verifique la configuración de OpenAI.";
      } else if (!err.response) {
        errorMessage = "Error de conexión. Verifique su red.";
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setCapturing(false);
      setProcessingStep("");
    }
  };

  // Mostrar pantalla de procesamiento SOLO cuando está procesando después de capturar
  if (capturing && processingStep !== "Capturando imagen...") {
    return (
      <View style={styles.processingContainer}>
        <View style={styles.processingContent}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="receipt" size={64} color="#2f7d36" />
            <View style={styles.spinnerOverlay}>
              <ActivityIndicator size="large" color="#2f7d36" />
            </View>
          </View>
          
          <Text style={styles.processingTitle}>Procesando Boleta</Text>
          <Text style={styles.processingStep}>{processingStep}</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill,
                { width: getProgressWidth(processingStep) }
              ]} />
            </View>
            <Text style={styles.progressText}>
              {getProgressText(processingStep)}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      
      {/* Overlay con guías visuales */}
      <View style={styles.overlay}>
        <View style={styles.topOverlay}>
          <Text style={styles.instructionText}>Centra la boleta en el marco</Text>
        </View>
        
        <View style={styles.scanFrame}>
          <View style={styles.corner} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        
        <View style={styles.bottomOverlay} />
      </View>
      
      {/* Botón de captura */}
      <View style={styles.captureContainer}>
        {capturing ? (
          <View style={styles.capturingState}>
            <ActivityIndicator color="#fff" size="large" />
            <Text style={styles.capturingText}>
              Capturando...
            </Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.captureButton} 
            onPress={handleCapture}
            activeOpacity={0.8}
          >
            <View style={styles.captureButtonInner}>
              <MaterialCommunityIcons name="camera" size={32} color="#fff" />
            </View>
            <Text style={styles.captureButtonText}>Capturar Boleta</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Funciones auxiliares para el progreso
function getProgressWidth(step) {
  switch (step) {
    case "Preparando imagen...": return "25%";
    case "Enviando al servidor...": return "50%";
    case "Analizando boleta con IA...": return "75%";
    case "¡Listo! Redirigiendo...": return "100%";
    default: return "0%";
  }
}

function getProgressText(step) {
  switch (step) {
    case "Preparando imagen...": return "1 de 4";
    case "Enviando al servidor...": return "2 de 4";
    case "Analizando boleta con IA...": return "3 de 4";
    case "¡Listo! Redirigiendo...": return "4 de 4";
    default: return "0 de 4";
  }
}

const styles = StyleSheet.create({
  // Pantalla de permisos
  permissionContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  permissionContent: {
    alignItems: "center",
    maxWidth: 320,
    width: "100%",
  },
  permissionIcon: {
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
    marginBottom: 16,
    textAlign: "center",
  },
  permissionMessage: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: "#2f7d36",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#2f7d36",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  
  // Pantalla de cámara
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 20,
  },
  instructionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  scanFrame: {
    height: 400,
    marginHorizontal: 20,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#2f7d36",
    borderWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  captureContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  captureButton: {
    alignItems: "center",
    gap: 12,
  },
  captureButtonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2f7d36",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  capturingState: {
    alignItems: "center",
    gap: 12,
  },
  capturingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  
  // Pantalla de procesamiento
  processingContainer: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  processingContent: {
    alignItems: "center",
    maxWidth: 300,
    width: "100%",
  },
  iconContainer: {
    position: "relative",
    marginBottom: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerOverlay: {
    position: "absolute",
    top: -8,
    right: -8,
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
    textAlign: "center",
  },
  processingStep: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 32,
    textAlign: "center",
    minHeight: 20,
  },
  progressContainer: {
    width: "100%",
    alignItems: "center",
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2f7d36",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: "500",
  },
});
