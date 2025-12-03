"use client";

import { useState, useEffect, useCallback } from "react";

export interface BasicComponent {
  id: string;
  name: string;
  description: string | null;
  html: string;
  css: string;
  javascript: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UseBasicComponentsReturn {
  components: BasicComponent[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  searchComponents: (query: string) => Promise<void>;
  deleteComponent: (id: string) => Promise<boolean>;
}

export function useBasicComponents(): UseBasicComponentsReturn {
  const [components, setComponents] = useState<BasicComponent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComponents = useCallback(async (search?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const url = search
        ? `/api/basic-components?search=${encodeURIComponent(search)}`
        : "/api/basic-components";

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch components");
      }

      // Ensure we always set an array, even if data.components is undefined
      setComponents(data.components || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setComponents([]); // Reset to empty array on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchComponents();
  }, [fetchComponents]);

  const searchComponents = useCallback(
    async (query: string) => {
      await fetchComponents(query);
    },
    [fetchComponents]
  );

  const deleteComponent = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/basic-components?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete component");
      }

      setComponents((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch (err) {
      console.error("Delete error:", err);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

  return {
    components,
    isLoading,
    error,
    refetch,
    searchComponents,
    deleteComponent,
  };
}
