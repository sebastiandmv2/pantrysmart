import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

// Hook personalizado para manejar llamadas a la API
export const useApi = (apiCall, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiCall();
        setData(result);
      } catch (err) {
        setError(err);
        console.error('API Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
};

// Hook específico para health check
export const useHealthCheck = () => {
  return useApi(() => apiService.healthCheck());
};

// Hook específico para receipts
export const useReceipts = () => {
  return useApi(() => apiService.receipts.getAll());
};

export default useApi;