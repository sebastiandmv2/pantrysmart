import { useState } from 'react';
import { Alert } from 'react-native';
// import config from '../../config';
import apiService from '../services/apiService';

// const API_BASE_URL = config.API_URL;
// const API_BASE_URL = 'http://10.0.2.2:8000'; // Para Android emulator
// const API_BASE_URL = 'http://localhost:8000'; // Para iOS simulator

export const useShoppingList = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addMissingIngredients = async (requestData) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Adding missing ingredients:', requestData);

      const response = await apiService.shopping.addMissingIngredients(requestData);
      return response;


      // // Timeout para la request (10 segundos)
      // const controller = new AbortController();
      // const timeoutId = setTimeout(() => controller.abort(), 10000);

      // const response = await fetch(`${API_BASE_URL}/shopping-list/add-missing-ingredients`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(requestData),
      //   signal: controller.signal,
      // });

      // clearTimeout(timeoutId);

      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      // }

      // const data = await response.json();
      
      // console.log('Ingredients added to shopping list successfully:', data);
      
      // return data;
    } catch (err) {
      console.error('Error adding ingredients to shopping list:', err);
      const errorMessage = err.message || 'Error agregando ingredientes';
      setError(errorMessage);
      
      Alert.alert(
        'Error agregando ingredientes',
        errorMessage,
        [
          { 
            text: 'Reintentar', 
            onPress: () => addMissingIngredients(requestData) 
          },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getShoppingList = async (userId) => {
    try {
      setLoading(true);
      setError(null);

      // const response = await fetch(`${API_BASE_URL}/shopping-list/user/${userId}`, {
      //   method: 'GET',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      // });

      const response = await apiService.shopping.getShoppingList(userId);
      return response;


      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      // }

      // const data = await response.json();
      // return data;
    } catch (err) {
      console.error('Error getting shopping list:', err);
      const errorMessage = err.message || 'Error obteniendo lista de compras';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getSummary = async (userId) => {
    try {
      // const response = await fetch(`${API_BASE_URL}/shopping-list/user/${userId}/summary`, {
      //   method: 'GET',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      // });
      const response = await apiService.shopping.getSummary(userId);
      return response;

      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      // }

      // const data = await response.json();
      // return data;
    } catch (err) {
      console.error('Error getting shopping list summary:', err);
      throw err;
    }
  };

  const markItemAsPurchased = async (itemId, actualPrice = null) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Marking item as purchased:', itemId);

      // const url = `${API_BASE_URL}/shopping-list/items/${itemId}/mark-purchased${actualPrice ? `?actual_price=${actualPrice}` : ''}`;

      // const response = await fetch(url, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      // });

      const data = await apiService.shopping.markPurchased(itemId, actualPrice);
      return data;


      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      // }

      // const data = await response.json();
      // console.log('Item marked as purchased:', data);
      
      // return data;
    } catch (err) {
      console.error('Error marking item as purchased:', err);
      const errorMessage = err.message || 'Error marcando item como comprado';
      setError(errorMessage);
      
      Alert.alert(
        'Error',
        'No se pudo marcar el item como comprado. Intenta nuevamente.',
        [{ text: 'OK' }]
      );
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateShoppingListItem = async (itemId, updateData) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Updating shopping list item:', itemId, updateData);

      const data = await apiService.shopping.updateItem(itemId, updateData);
      return data;


      // const response = await fetch(`${API_BASE_URL}/shopping-list/items/${itemId}`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(updateData),
      // });

      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      // }

      // const data = await response.json();
      // console.log('Shopping list item updated:', data);
      
      // return data;
    } catch (err) {
      console.error('Error updating shopping list item:', err);
      const errorMessage = err.message || 'Error actualizando item';
      setError(errorMessage);
      
      Alert.alert(
        'Error',
        'No se pudo actualizar el item. Intenta nuevamente.',
        [{ text: 'OK' }]
      );
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteShoppingListItem = async (itemId) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Deleting shopping list item:', itemId);

      const data = await apiService.shopping.deleteItem(itemId);
      return data;


      // const response = await fetch(`${API_BASE_URL}/shopping-list/items/${itemId}`, {
      //   method: 'DELETE',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      // });

      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      // }

      // const data = await response.json();
      // console.log('Shopping list item deleted:', data);
      
      // return data;
    } catch (err) {
      console.error('Error deleting shopping list item:', err);
      const errorMessage = err.message || 'Error eliminando item';
      setError(errorMessage);
      
      Alert.alert(
        'Error',
        'No se pudo eliminar el item. Intenta nuevamente.',
        [{ text: 'OK' }]
      );
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addItemToInventory = async (userId, productId, quantity) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Adding item to inventory:', { userId, productId, quantity });

      const data = await apiService.shopping.addToInventory({
        user_id: userId,
        product_id: productId,
        quantity,
        unit: "unidades",
      });
      return data;

      // const response = await fetch(`${API_BASE_URL}/inventory/add`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     user_id: userId,
      //     product_id: productId,
      //     quantity: quantity,
      //     unit: "unidades"
      //   }),
      // });

      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      // }

      // const data = await response.json();
      // console.log('Item added to inventory:', data);
      
      // return data;
    } catch (err) {
      console.error('Error adding item to inventory:', err);
      const errorMessage = err.message || 'Error agregando al inventario';
      setError(errorMessage);
      
      Alert.alert(
        'Error',
        'No se pudo agregar el item al inventario. Intenta nuevamente.',
        [{ text: 'OK' }]
      );
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    addMissingIngredients,
    getShoppingList,
    getSummary,
    markItemAsPurchased,
    updateShoppingListItem,
    deleteShoppingListItem,
    addItemToInventory,
  };
};

export default useShoppingList;