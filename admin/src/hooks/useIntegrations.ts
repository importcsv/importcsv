"use client";

import { useState, useEffect, useCallback } from "react";
import { integrationsApi, Integration } from "@/utils/apiClient";

export function useIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await integrationsApi.getIntegrations();
      setIntegrations(data);
    } catch (err) {
      console.error("Failed to fetch integrations:", err);
      setError("Failed to load integrations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  return {
    integrations,
    isLoading,
    error,
    refetch: fetchIntegrations,
  };
}
