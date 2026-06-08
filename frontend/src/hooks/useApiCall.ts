import { useState, useCallback } from 'react';
import { ToastType } from './useToast';

interface UseApiCallOptions {
  onSuccess?: (data: any) => void;
  successMessage?: string;
  showToast: (message: string, type: ToastType) => void;
}

export function useApiCall({ onSuccess, successMessage, showToast }: UseApiCallOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (apiFn: () => Promise<any>) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await apiFn();
        if (successMessage) {
          showToast(successMessage, 'success');
        }
        onSuccess?.(result);
        return result;
      } catch (err: any) {
        const message = err?.message || 'Something went wrong. Please try again.';
        setError(message);
        showToast(message, 'error');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess, successMessage, showToast]
  );

  return { execute, isLoading, error };
}
