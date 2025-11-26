// Configuración de la aplicación móvil
const config = {
  // URL de la API - CAMBIA ESTA URL SEGÚN TU SETUP
  API_URL: process.env.API_URL || 'https://pdf-ryan-ferrari-revisions.trycloudflare.com',
  
  // Configuración de desarrollo
  DEV_MODE: typeof __DEV__ !== 'undefined' ? __DEV__ : true,
  
  // Configuración de Expo
  EXPO_HOST: process.env.EXPO_DEVTOOLS_LISTEN_ADDRESS || '0.0.0.0',
  
  // Timeout más largo para health check (Cloudflare tarda en estar listo)
  HEALTH_CHECK_TIMEOUT: 15000, // 15 segundos
};

export default config;