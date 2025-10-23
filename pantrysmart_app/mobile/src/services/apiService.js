import axios from 'axios';
import config from '../../config';

// Función para convertir base64 a blob (para web)
const base64ToBlob = (base64Data, contentType = 'image/jpeg') => {
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
};

// Crear instancia de axios con configuración base
const apiClient = axios.create({
  baseURL: config.API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para requests (agregar headers, auth, etc.)
apiClient.interceptors.request.use(
  (config) => {
    if (config.DEV_MODE) {
      console.log('API Request:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para responses (manejo de errores globales)
apiClient.interceptors.response.use(
  (response) => {
    if (config.DEV_MODE) {
      console.log('API Response:', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    if (config.DEV_MODE) {
      console.error('API Error:', error.response?.status, error.config?.url);
    }
    return Promise.reject(error);
  }
);

// Servicios de la API
export const apiService = {
  // Health check
  healthCheck: async () => {
    try {
      const response = await apiClient.get('/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Receipts endpoints
  receipts: {
    // Debug upload para verificar formato
    debugUpload: async (imageFile) => {
      const formData = new FormData();
      
      // Verificar si es base64 (web) o URI (móvil)
      if (imageFile.uri.startsWith('data:image/')) {
        // Es base64, convertir a blob
        const base64Data = imageFile.uri.split(',')[1];
        const blob = base64ToBlob(base64Data, 'image/jpeg');
        formData.append('file', blob, 'receipt.jpg');
      } else {
        // Es URI de archivo real (React Native)
        formData.append('file', {
          uri: imageFile.uri,
          type: 'image/jpeg',
          name: 'receipt.jpg',
        });
      }

      const response = await fetch(`${config.API_URL}/receipts/debug-upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Debug API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    },

    // Extraer datos de la imagen de boleta
    extractReceipt: async (imageFile) => {
      const formData = new FormData();
      
      // Verificar si es base64 (web) o URI (móvil)
      if (imageFile.uri.startsWith('data:image/')) {
        // Es base64, convertir a blob
        const base64Data = imageFile.uri.split(',')[1];
        const blob = base64ToBlob(base64Data, 'image/jpeg');
        formData.append('file', blob, 'receipt.jpg');
      } else {
        // Es URI de archivo real (React Native)
        formData.append('file', {
          uri: imageFile.uri,
          type: 'image/jpeg',
          name: 'receipt.jpg',
        });
      }

      // Usar fetch directamente para mejor compatibilidad
      const response = await fetch(`${config.API_URL}/receipts/extract-receipt`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    },
    
    // Confirmar y guardar la boleta procesada
    confirmReceipt: async (receiptData) => {
      const response = await apiClient.post('/receipts/confirm', receiptData);
      return response.data;
    },
    
    // Obtener boleta por ID
    getById: async (id) => {
      const response = await apiClient.get(`/receipts/${id}`);
      return response.data;
    },
    
    // Obtener boletas por usuario
    getByUser: async (userId) => {
      const response = await apiClient.get(`/receipts/user/${userId}`);
      return response.data;
    },
  },

  // Agregar más servicios según tus endpoints
};

export default apiService;