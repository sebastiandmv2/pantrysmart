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
      console.error('API Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        message: error.message,
        code: error.code
      });
    }
    return Promise.reject(error);
  }
);

// Fetch sin timeout para operaciones largas (IA)
const fetchNoTimeout = async (url, options = {}) => {
  const response = await fetch(url, options);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return await response.json();
};


// Servicios de la API
export const apiService = {
  // Health check con reintentos para túneles lentos
  healthCheck: async () => {
    const maxRetries = 3;
    const retryDelay = 3000; // 3 segundos entre reintentos
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🏥 Verificando salud del servidor (intento ${attempt}/${maxRetries}):`, config.API_URL);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.HEALTH_CHECK_TIMEOUT || 15000);
        
        const response = await fetch(`${config.API_URL}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        console.log('🏥 Health check response:', response.status, response.statusText);
        
        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Servidor saludable:', data);
        return data;
        
      } catch (error) {
        console.error(`❌ Health check intento ${attempt} falló:`, error.message);
        
        // Si es el último intento, lanzar el error
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Esperar antes del siguiente intento
        console.log(`⏳ Esperando ${retryDelay/1000}s antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
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
      const response = await fetch(`${config.API_URL}/receipts/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(receiptData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Confirm API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    },
    
    // Obtener boleta por ID
    getById: async (id) => {
      const response = await fetch(`${config.API_URL}/receipts/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('GetById API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    },
    
    // Obtener boletas por usuario
    getByUser: async (userId) => {
      const response = await fetch(`${config.API_URL}/receipts/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('GetByUser API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    },
  },

  // Inventory endpoints
  inventory: {
    // Obtener resumen del inventario
    getSummary: async (userId) => {
      const response = await fetch(`${config.API_URL}/inventory/user/${userId}/summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Inventory Summary API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    },

    // Obtener items del inventario
    getItems: async (userId, options = {}) => {
      const params = new URLSearchParams();
      if (options.category) params.append('category', options.category);
      if (options.stock_level) params.append('stock_level', options.stock_level);
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());

      const url = `${config.API_URL}/inventory/user/${userId}/items${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Inventory Items API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    },

    // Obtener productos con stock bajo
    getLowStock: async (userId) => {
      const response = await fetch(`${config.API_URL}/inventory/user/${userId}/low-stock`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Low Stock API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    },

    // Obtener productos próximos a vencer
    getExpiringSoon: async (userId, days = 3) => {
      const response = await fetch(`${config.API_URL}/inventory/user/${userId}/expiring-soon?days=${days}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Expiring Soon API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    },

    // Obtener categorías de productos
    getCategories: async () => {
      const response = await fetch(`${config.API_URL}/inventory/products/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Categories API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    },

    // Obtener inventario por categoría
    getByCategory: async (userId, category) => {
      const response = await fetch(`${config.API_URL}/inventory/user/${userId}/by-category/${category}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Category Items API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    },

    // Agregar producto al inventario
    addItem: async (userId, itemData) => {
      const response = await fetch(`${config.API_URL}/inventory/user/${userId}/add-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Add Item API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    },

    // Actualizar item del inventario
    updateItem: async (itemId, updateData) => {
      const response = await fetch(`${config.API_URL}/inventory/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update Item API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    },

    // Consumir producto del inventario
    consumeItem: async (itemId, quantity, reason = null) => {
      const params = new URLSearchParams({ quantity: quantity.toString() });
      if (reason) params.append('reason', reason);

      const response = await fetch(`${config.API_URL}/inventory/items/${itemId}/consume?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Consume Item API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    },

    // Eliminar item del inventario
    deleteItem: async (itemId) => {
      const response = await fetch(`${config.API_URL}/inventory/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete Item API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    },

    // Buscar productos
    searchProducts: async (query, limit = 10) => {
      const params = new URLSearchParams({ q: query, limit: limit.toString() });
      
      const response = await fetch(`${config.API_URL}/inventory/products/search?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Search Products API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    },

    // Obtener historial de movimientos
    getMovements: async (userId, productId = null, limit = 50, offset = 0) => {
      const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
      if (productId) params.append('product_id', productId.toString());

      const response = await fetch(`${config.API_URL}/inventory/user/${userId}/movements?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Movements API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    },

    // Obtener inventario agrupado por tipo genérico
    getGroupedInventory: async (userId) => {
      const response = await fetch(`${config.API_URL}/inventory/user/${userId}/grouped`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Grouped Inventory API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    },

    // Obtener resumen agrupado
    getSummaryGrouped: async (userId) => {
      const response = await fetch(`${config.API_URL}/inventory/user/${userId}/summary-grouped`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Summary Grouped API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    },

    // Endpoints demo
    demo: {
      getSummary: async () => {
        const response = await fetch(`${config.API_URL}/inventory/demo/summary`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Demo Summary API Error:', response.status, errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data;
      },

      getItems: async (category = null) => {
        const params = category ? `?category=${category}` : '';
        
        const response = await fetch(`${config.API_URL}/inventory/demo/items${params}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Demo Items API Error:', response.status, errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data;
      },

      addSampleData: async () => {
        const response = await fetch(`${config.API_URL}/inventory/demo/add-sample-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Demo Sample Data API Error:', response.status, errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data;
      },
    }
  },

  // Shopping List endpoints
  shopping: {
    addMissingIngredients: async (data) => {
      const response = await fetch(`${config.API_URL}/shopping-list/add-missing-ingredients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err);
      }

      return await response.json();
    },

    getShoppingList: async (userId) => {
      const response = await fetch(`${config.API_URL}/shopping-list/user/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err);
      }

      return await response.json();
    },

    getSummary: async (userId) => {
      const response = await fetch(`${config.API_URL}/shopping-list/user/${userId}/summary`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err);
      }

      return await response.json();
    },

    markPurchased: async (itemId, actualPrice) => {
      const url = `${config.API_URL}/shopping-list/items/${itemId}/mark-purchased${
        actualPrice ? `?actual_price=${actualPrice}` : ""
      }`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err);
      }

      return await response.json();
    },

    updateItem: async (itemId, data) => {
      const response = await fetch(`${config.API_URL}/shopping-list/items/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err);
      }

      return await response.json();
    },

    deleteItem: async (itemId) => {
      const response = await fetch(`${config.API_URL}/shopping-list/items/${itemId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err);
      }

      return await response.json();
    },

    addToInventory: async (data) => {
      const response = await fetch(`${config.API_URL}/inventory/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error(await response.text());
      return await response.json();
    },
  },


  // Recipes endpoints
  recipes: {
    // Obtener lista de recetas con disponibilidad
    getRecipes: async (userId, options = {}) => {
      const params = new URLSearchParams({ user_id: userId });
      if (options.skip) params.append('skip', options.skip.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.difficulty) params.append('difficulty', options.difficulty);
      if (options.search) params.append('search', options.search);

      const response = await fetch(`${config.API_URL}/recipes/?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Recipes API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    },

    // Obtener detalle de una receta con disponibilidad
    getRecipeDetail: async (recipeId, userId) => {
      const params = new URLSearchParams({ user_id: userId });

      const response = await fetch(`${config.API_URL}/recipes/${recipeId}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Recipe Detail API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    },

    // Crear nueva receta
    createRecipe: async (recipeData) => {
      const response = await fetch(`${config.API_URL}/recipes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipeData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Create Recipe API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    },

    // Actualizar receta
    updateRecipe: async (recipeId, updateData) => {
      const response = await fetch(`${config.API_URL}/recipes/${recipeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update Recipe API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    },

    // Eliminar receta
    deleteRecipe: async (recipeId) => {
      const response = await fetch(`${config.API_URL}/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete Recipe API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    },

    // Generar recetas con IA (sin timeout)
    generateWithAI: async (params) => {
      return await fetchNoTimeout(`${config.API_URL}/recipes/generate-with-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
    },

  },
};

export default apiService;