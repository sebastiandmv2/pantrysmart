// src/screens/ScanScreen.js
import React, { useRef, useState } from "react";
import { View, Text, Button, ActivityIndicator, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useReceiptScan } from "../hooks/useReceiptScan";
import { apiService } from "../services/apiService";

export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const { loading, error, extractReceipt } = useReceiptScan();

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ marginBottom: 12 }}>Necesitamos acceso a la cámara</Text>
        <Button title="Conceder permiso" onPress={requestPermission} />
      </View>
    );
  }

  const handleCapture = async () => {
    try {
      setCapturing(true);
      
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

      // Preparar archivo para envío
      const imageFile = {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'receipt.jpg',
      };

      console.log('Sending image to API...');
      
      // Primero probar el debug upload
      try {
        const debugResult = await apiService.receipts.debugUpload(imageFile);
        console.log('Debug upload result:', debugResult);
      } catch (debugErr) {
        console.error('Debug upload failed:', debugErr);
      }
      
      // Extraer datos de la boleta usando IA
      const extractedData = await extractReceipt(imageFile);
      
      console.log('Extracted data:', extractedData);
      
      // Navegar a la pantalla de revisión con los datos extraídos
      navigation.navigate("Review", { 
        imageUri: photo.uri,
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
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {}
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
      <View style={{ position: "absolute", bottom: 30, alignSelf: "center" }}>
        {(capturing || loading) ? (
          <View style={{ alignItems: "center" }}>
            <ActivityIndicator color="#fff" size="large" />
            <Text style={{ color: "#fff", marginTop: 8 }}>
              {capturing ? "Capturando..." : "Procesando boleta..."}
            </Text>
          </View>
        ) : (
          <Button title="Capturar boleta" onPress={handleCapture} />
        )}
      </View>
    </View>
  );
}
