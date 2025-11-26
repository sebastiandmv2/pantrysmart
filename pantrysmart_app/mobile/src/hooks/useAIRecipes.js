import { useState, useCallback } from "react";
import { Alert } from "react-native";
import config from "../../config";
import apiService from "../services/apiService";

const API_BASE_URL = config.API_URL;

// Configuración de retry
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 segundo
  backoffMultiplier: 2, // Incremento exponencial
};

export const useAIRecipes = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastRequestData, setLastRequestData] = useState(null);
  const [isRetryingInternal, setIsRetryingInternal] = useState(false);

  // Delay helper
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Mensajes de error amigables
  const getErrorMessage = (error) => {
    if (error.message?.includes("OPENAI_API_KEY")) {
      return "Servicio de IA no configurado. Contacta al administrador.";
    }
    if (error.message?.includes("timeout")) {
      return "La generación está tardando más de lo esperado. Intenta con parámetros más simples.";
    }
    if (error.message?.includes("network") || error.message?.includes("fetch")) {
      return "Error de conexión. Verifica tu internet e intenta nuevamente.";
    }
    if (error.message?.includes("no generó exactamente 3 recetas")) {
      return "Error en la generación. Intenta con diferentes parámetros.";
    }
    return error.message || "Error inesperado generando recetas";
  };

  /**
   * Generar recetas con IA (con reintentos automáticos).
   * - attempt = número de intento (1 = primera vez).
   */
  const generateRecipes = async (requestData, attempt = 1) => {
    const isOuterCall = attempt === 1;

    try {
      if (isOuterCall) {
        // Primera vez que se llama: resetea estado general
        setLoading(true);
        setError(null);
        setRetryCount(0);
        setLastRequestData(requestData);
        setIsRetryingInternal(false);
      }

      console.log(`Generating recipes (attempt ${attempt}):`, requestData);

      const data = await apiService.recipes.generateWithAI(requestData);

      console.log("Generated recipes successfully:", data);

      if (!data.recipes || data.recipes.length !== 3) {
        throw new Error("La IA no generó exactamente 3 recetas");
      }

      // Éxito → reseteamos contador y estado de retry
      setRetryCount(0);
      setError(null);
      if (isOuterCall) {
        setIsRetryingInternal(false);
      }

      return data;
    } catch (err) {
      console.error(`Error generating recipes (attempt ${attempt}):`, err);

      const errorMessage = getErrorMessage(err);
      setError(errorMessage);

      const shouldRetry =
        attempt < RETRY_CONFIG.maxRetries &&
        !err.message?.includes("OPENAI_API_KEY");

      if (shouldRetry) {
        const nextAttempt = attempt + 1;
        // retryCount = cuántos reintentos vamos haciendo (1, 2, …)
        setRetryCount(nextAttempt - 1);
        setIsRetryingInternal(true);

        const delayMs =
          RETRY_CONFIG.retryDelay *
          Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1);
        console.log(`Retrying in ${delayMs}ms...`);
        await delay(delayMs);

        // Llamada recursiva al siguiente intento
        return generateRecipes(requestData, nextAttempt);
      } else {
        // Sin más reintentos
        if (isOuterCall) {
          setIsRetryingInternal(false);
        }

        Alert.alert(
          "Error generando recetas",
          `${errorMessage}\n\nIntentos realizados: ${attempt}`,
          [
            {
              text: "Reintentar",
              onPress: () => generateRecipes(requestData, 1),
            },
            { text: "Cancelar", style: "cancel" },
          ]
        );

        throw err;
      }
    } finally {
      if (isOuterCall) {
        setLoading(false);
      }
    }
  };

  // Retry manual usando el último request
  const retryLastGeneration = useCallback(async () => {
    if (!lastRequestData) {
      Alert.alert("Error", "No hay una generación previa para reintentar");
      return;
    }

    return generateRecipes(lastRequestData, 1);
  }, [lastRequestData]);

  /**
   * Guardar una receta generada por IA en la BD
   */
  const saveGeneratedRecipe = async (requestData) => {
    try {
      setLoading(true);
      setError(null);

      console.log("Saving generated recipe:", requestData.recipe.name);

      // Validaciones básicas
      if (!requestData.recipe || !requestData.recipe.name) {
        throw new Error("Datos de receta inválidos");
      }

      if (
        !requestData.recipe.ingredients ||
        requestData.recipe.ingredients.length === 0
      ) {
        throw new Error("La receta debe tener al menos un ingrediente");
      }

      // Timeout de 20s
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const response = await fetch(`${API_BASE_URL}/recipes/save-generated`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Recipe saved successfully:", {
        id: data.id,
        name: data.name,
        ingredients: data.ingredients?.length || 0,
      });

      return data;
    } catch (err) {
      console.error("Error saving recipe:", err);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);

      Alert.alert(
        "Error guardando receta",
        `${errorMessage}\n\n¿Deseas intentar nuevamente?`,
        [
          {
            text: "Reintentar",
            onPress: () => saveGeneratedRecipe(requestData),
          },
          { text: "Cancelar", style: "cancel" },
        ]
      );

      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Stats de IA
  const getAIStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/recipes/ai/stats`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Error getting AI stats:", err);
      throw err;
    }
  };

  return {
    loading,
    error,
    retryCount,
    generateRecipes,
    saveGeneratedRecipe,
    retryLastGeneration,
    getAIStats,
    canRetry: !!lastRequestData,
    isRetrying: isRetryingInternal,
  };
};

export default useAIRecipes;
