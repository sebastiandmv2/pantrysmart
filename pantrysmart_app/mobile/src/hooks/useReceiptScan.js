import { useState } from 'react';
import { apiService } from '../services/apiService';

export const useReceiptScan = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [extractedData, setExtractedData] = useState(null);

  // Extraer datos de la imagen
  const extractReceipt = async (imageFile) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.receipts.extractReceipt(imageFile);
      setExtractedData(result);
      return result;
    } catch (err) {
      setError(err);
      console.error('Error extracting receipt:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Confirmar y guardar la boleta
  const confirmReceipt = async (receiptData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.receipts.confirmReceipt(receiptData);
      return result;
    } catch (err) {
      setError(err);
      console.error('Error confirming receipt:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Resetear estado
  const reset = () => {
    setLoading(false);
    setError(null);
    setExtractedData(null);
  };

  return {
    loading,
    error,
    extractedData,
    extractReceipt,
    confirmReceipt,
    reset,
  };
};

export default useReceiptScan;