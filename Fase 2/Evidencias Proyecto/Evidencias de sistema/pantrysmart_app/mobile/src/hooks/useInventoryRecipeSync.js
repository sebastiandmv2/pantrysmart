import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

export const useInventoryRecipeSync = () => {
  const [syncing, setSyncing] = useState(false);

  const syncInventoryWithRecipes = useCallback(async (userId) => {
    try {
      setSyncing(true);
      
      // En una implementación real, esto podría:
      // 1. Obtener el inventario actualizado
      // 2. Recalcular disponibilidad de todas las recetas
      // 3. Actualizar cache de recetas
      // 4. Notificar cambios
      
      console.log('Syncing inventory with recipes for user:', userId);
      
      // Simular delay de sincronización
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'Disponibilidad de recetas actualizada',
        updatedRecipes: 0 // En implementación real, número de recetas actualizadas
      };
      
    } catch (error) {
      console.error('Error syncing inventory with recipes:', error);
      throw error;
    } finally {
      setSyncing(false);
    }
  }, []);

  const notifyRecipeAvailabilityChange = useCallback(async (productName, quantity, userId) => {
    try {
      // En una implementación real, esto podría:
      // 1. Buscar recetas que usen este producto
      // 2. Recalcular su disponibilidad
      // 3. Mostrar notificación si alguna receta ahora está disponible
      
      console.log(`Product ${productName} (${quantity}) added to inventory for user ${userId}`);
      
      // Simular búsqueda de recetas afectadas
      const affectedRecipes = [
        // En implementación real, esto vendría del backend
        { name: "Tortilla de Verduras Express", newAvailability: 66.7 },
        { name: "Ensalada Fresca", newAvailability: 100.0 }
      ];
      
      // Mostrar notificación si hay recetas que ahora están más disponibles
      const nowAvailableRecipes = affectedRecipes.filter(recipe => recipe.newAvailability >= 80);
      
      if (nowAvailableRecipes.length > 0) {
        Alert.alert(
          "🎉 ¡Recetas disponibles!",
          `Agregaste "${productName}" a tu inventario.\n\n✅ Recetas ahora disponibles:\n${nowAvailableRecipes.map(r => `• ${r.name}`).join('\n')}`,
          [
            {
              text: "Ver recetas",
              onPress: () => {
                // En implementación real, navegar a RecipesScreen con filtro
                console.log("Navigate to recipes with filter");
              }
            },
            { text: "Continuar", style: "cancel" }
          ]
        );
      }
      
      return affectedRecipes;
      
    } catch (error) {
      console.error('Error notifying recipe availability change:', error);
      throw error;
    }
  }, []);

  const getRecipeAvailabilityImpact = useCallback(async (productId, userId) => {
    try {
      // En una implementación real, esto consultaría el backend para ver
      // qué recetas usan este producto y cuál sería el impacto en disponibilidad
      
      console.log(`Getting recipe availability impact for product ${productId}`);
      
      // Mock data
      return {
        affectedRecipes: [
          { 
            id: 22, 
            name: "Tortilla de Verduras Express", 
            currentAvailability: 33.3, 
            newAvailability: 66.7,
            impact: "medium" 
          }
        ],
        totalAffected: 1
      };
      
    } catch (error) {
      console.error('Error getting recipe availability impact:', error);
      throw error;
    }
  }, []);

  return {
    syncing,
    syncInventoryWithRecipes,
    notifyRecipeAvailabilityChange,
    getRecipeAvailabilityImpact,
  };
};

export default useInventoryRecipeSync;