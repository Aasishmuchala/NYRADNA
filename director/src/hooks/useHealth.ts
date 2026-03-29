'use client';

import { useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface HealthStatus {
  replicate: boolean;
  issues: string[];
}

export function useHealth() {
  const [status, setStatus] = useState<HealthStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const check = useCallback(async () => {
    setIsChecking(true);
    try {
      const result = await apiFetch<HealthStatus>('/api/health');
      setStatus(result);
      return result;
    } catch {
      const fallback: HealthStatus = { replicate: false, issues: ['Health check endpoint unreachable'] };
      setStatus(fallback);
      return fallback;
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    check,
    status,
    isChecking,
    isReady: status?.replicate ?? false,
    issues: status?.issues ?? [],
  };
}
