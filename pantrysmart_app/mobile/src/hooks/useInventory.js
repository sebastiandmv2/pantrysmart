import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

const DEMO_USER_ID = 'demo-user';

export const useInventory = (userId = DEMO_USER_ID) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  // Cargar resumen del inventario
  const loadInventorySummary = async () => {
    try {
      setError(null);
      const summaryData = await apiService.inventory.getSummary(userId);
      setSummary(summaryData);
      return summaryData;
    } catch (err) {
      console.error('Error loading inventory summary:', err);
      setError(err);
      return null;
    }
  };

  // Cargar categorías con productos
  const loadCategories = async () => {
    try {
      setError(null);
      const categoriesData = await apiService.inventory.getCategories();
      const userItems = await apiService.inventory.getItems(userId);
      
      // Mapear categorías con conteos reales
      const categoriesWithCounts = categoriesData.categories.map(category => {
        const categoryItems = userItems.filter(item => 
          item.product.category === category.id
        );
        
        return {
          id: category.id,
          name: category.name,
          icon: category.icon,
          color: category.color,
          count: categoryItems.length,
          totalQuantity: categoryItems.reduce((sum, item) => sum + item.current_quantity, 0)
        };
      }).filter(category => category.count > 0); // Solo mostrar categorías con productos
      
      setCategories(categoriesWithCounts);
      return categoriesWithCounts;
    } catch (err) {
      console.error('Error loading categories:', err);
      setError(err);
      return [];
    }
  };

  // Cargar productos recientes (últimos agregados/actualizados)
  const loadRecentProducts = async () => {
    try {
      setError(null);
      const items = await apiService.inventory.getItems(userId, { limit: 10 });
      
      // Formatear productos recientes
      const recentItems = items.map(item => ({
        id: item.id.toString(),
        name: item.product.name,
        note: formatProductNote(item),
        level: item.stock_level,
        quantity: item.current_quantity,
        unit: item.unit,
        category: item.product.category,
        updatedAt: item.updated_at
      }));
      
      setRecentProducts(recentItems);
      return recentItems;
    } catch (err) {
      console.error('Error loading recent products:', err);
      setError(err);
      return [];
    }
  };

  // Cargar productos con stock bajo
  const loadLowStockProducts = async () => {
    try {
      setError(null);
      const items = await apiService.inventory.getLowStock(userId);
      
      const lowStockItems = items.map(item => ({
        id: item.id.toString(),
        name: item.product.name,
        currentQuantity: item.current_quantity,
        minAlert: item.min_stock_alert,
        unit: item.unit,
        level: item.stock_level,
        category: item.product.category
      }));
      
      setLowStockProducts(lowStockItems);
      return lowStockItems;
    } catch (err) {
      console.error('Error loading low stock products:', err);
      setError(err);
      return [];
    }
  };

  // Cargar todos los datos
  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadInventorySummary(),
        loadCategories(),
        loadRecentProducts(),
        loadLowStockProducts()
      ]);
    } catch (err) {
      console.error('Error loading inventory data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Refrescar datos
  const refresh = async () => {
    await loadAllData();
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    loadAllData();
  }, [userId]);

  return {
    loading,
    error,
    summary,
    categories,
    recentProducts,
    lowStockProducts,
    refresh,
    loadInventorySummary,
    loadCategories,
    loadRecentProducts,
    loadLowStockProducts,
  };
};

// Función helper para formatear la nota del producto
const formatProductNote = (item) => {
  const parts = [];
  
  // Cantidad y unidad
  if (item.current_quantity && item.unit) {
    parts.push(`${item.current_quantity} ${item.unit}`);
  }
  
  // Precio si está disponible
  if (item.purchase_price) {
    parts.push(`$${item.purchase_price.toLocaleString('es-CL')}`);
  }
  
  // Tiempo desde la última actualización
  if (item.updated_at) {
    const timeAgo = getTimeAgo(item.updated_at);
    parts.push(timeAgo);
  }
  
  return parts.join(' • ');
};

// Función helper para calcular tiempo transcurrido
const getTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return 'hace menos de 1 hora';
  } else if (diffInHours < 24) {
    return `hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    } else {
      const diffInWeeks = Math.floor(diffInDays / 7);
      return `hace ${diffInWeeks} semana${diffInWeeks > 1 ? 's' : ''}`;
    }
  }
};

export default useInventory;