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
      let result: any = null;
      try {
        result = await apiFn();
        if (successMessage) {
          showToast(successMessage, 'success');
        }
      } catch (err: any) {
        const message = err?.message || 'Something went wrong. Please try again.';
        setError(message);
        showToast(message, 'error');
        setIsLoading(false);
        return null;
      }
      setIsLoading(false);
      // Run onSuccess OUTSIDE the try-catch so that errors in the callback
      // (e.g. fetchUserProfile network glitch) don't show as API errors.
      try {
        await onSuccess?.(result);
      } catch {
        // onSuccess errors are silently ignored — the primary API call succeeded.
      }
      return result;
    },
    [onSuccess, successMessage, showToast]
  );

  return { execute, isLoading, error };
}
