import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';

export const useRecipes = (userId) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadRecipes = useCallback(async (options = {}) => {
    if (!userId) {
      setError('User ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await apiService.recipes.getRecipes(userId, options);
      setRecipes(data);
    } catch (err) {
      console.error('Error loading recipes:', err);
      setError(err.message || 'Error loading recipes');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const refreshRecipes = useCallback(async (options = {}) => {
    if (!userId) return;

    try {
      setRefreshing(true);
      setError(null);
      
      const data = await apiService.recipes.getRecipes(userId, options);
      setRecipes(data);
    } catch (err) {
      console.error('Error refreshing recipes:', err);
      setError(err.message || 'Error refreshing recipes');
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  const searchRecipes = useCallback(async (searchTerm, difficulty = null) => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      
      const options = { search: searchTerm };
      if (difficulty) options.difficulty = difficulty;
      
      const data = await apiService.recipes.getRecipes(userId, options);
      setRecipes(data);
    } catch (err) {
      console.error('Error searching recipes:', err);
      setError(err.message || 'Error searching recipes');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Cargar recetas al montar el componente
  useEffect(() => {
    if (userId) {
      loadRecipes();
    }
  }, [userId, loadRecipes]);

  return {
    recipes,
    loading,
    error,
    refreshing,
    loadRecipes,
    refreshRecipes,
    searchRecipes,
  };
};

export const useRecipeDetail = () => {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadRecipeDetail = useCallback(async (recipeId, userId) => {
    if (!recipeId || !userId) {
      setError('Recipe ID and User ID are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await apiService.recipes.getRecipeDetail(recipeId, userId);
      setRecipe(data);
    } catch (err) {
      console.error('Error loading recipe detail:', err);
      setError(err.message || 'Error loading recipe detail');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearRecipe = useCallback(() => {
    setRecipe(null);
    setError(null);
  }, []);

  return {
    recipe,
    loading,
    error,
    loadRecipeDetail,
    clearRecipe,
  };
};