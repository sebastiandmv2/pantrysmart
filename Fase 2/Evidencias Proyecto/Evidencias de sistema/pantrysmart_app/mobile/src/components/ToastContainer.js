import React from "react";
import { View, StyleSheet } from "react-native";
import ToastNotification from "./ToastNotification";

export default function ToastContainer({ toasts, onHideToast }) {
  return (
    <View style={styles.container} pointerEvents="none">
      {toasts.map((toast, index) => (
        <ToastNotification
          key={toast.id}
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onHide={() => onHideToast(toast.id)}
          style={{ top: 50 + (index * 70) }} // Stack multiple toasts
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
});