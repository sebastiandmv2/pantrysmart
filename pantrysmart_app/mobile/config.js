// Configuración de la aplicación móvil
const config = {
  // URL de la API - se puede sobrescribir con variables de entorno
  API_URL: process.env.API_URL || 'http://localhost:8000',
  
  // Configuración de desarrollo
  DEV_MODE: typeof __DEV__ !== 'undefined' ? __DEV__ : true,
  
  // Configuración de Expo
  EXPO_HOST: process.env.EXPO_DEVTOOLS_LISTEN_ADDRESS || '0.0.0.0',
};

export default config;