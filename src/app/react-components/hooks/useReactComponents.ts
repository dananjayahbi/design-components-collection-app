"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface ReactComponent {
  id: string;
  name: string;
  description: string | null;
  componentCode: string;
  cssCode: string;
  tags: string[];
  isFavorite: boolean;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

interface UseReactComponentsReturn {
  components: ReactComponent[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  pagination: Pagination | null;
  refetch: () => Promise<void>;
  searchComponents: (query: string) => Promise<void>;
  loadMore: () => Promise<void>;
  deleteComponent: (id: string) => Promise<boolean>;
  searchQuery: string;
}

const ITEMS_PER_PAGE = 10;

export function useReactComponents(): UseReactComponentsReturn {
  const [components, setComponents] = useState<ReactComponent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const currentSearchRef = useRef("");

  const fetchComponents = useCallback(async (search?: string, page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Build URL with search and pagination params
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", ITEMS_PER_PAGE.toString());
      
      if (search) {
        params.set("search", search);
      }

      const url = `/api/react-components?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch components");
      }

      if (append) {
        // Append to existing components for infinite scroll
        setComponents(prev => [...prev, ...(data.components || [])]);
      } else {
        // Replace components for new search or initial load
        setComponents(data.components || []);
      }
      
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      if (!append) {
        setComponents([]);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    currentSearchRef.current = searchQuery;
    await fetchComponents(searchQuery, 1, false);
  }, [fetchComponents, searchQuery]);

  const searchComponents = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      currentSearchRef.current = query;
      await fetchComponents(query, 1, false);
    },
    [fetchComponents]
  );

  const loadMore = useCallback(async () => {
    if (!pagination || !pagination.hasMore || isLoadingMore) return;
    
    const nextPage = pagination.page + 1;
    await fetchComponents(currentSearchRef.current, nextPage, true);
  }, [fetchComponents, pagination, isLoadingMore]);

  const deleteComponent = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/react-components?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete component");
      }

      setComponents((prev) => prev.filter((c) => c.id !== id));
      
      // Update pagination count
      if (pagination) {
        setPagination(prev => prev ? {
          ...prev,
          totalCount: prev.totalCount - 1,
        } : null);
      }
      
      return true;
    } catch (err) {
      console.error("Delete error:", err);
      return false;
    }
  }, [pagination]);

  useEffect(() => {
    fetchComponents("", 1, false);
  }, [fetchComponents]);

  return {
    components,
    isLoading,
    isLoadingMore,
    error,
    pagination,
    refetch,
    searchComponents,
    loadMore,
    deleteComponent,
    searchQuery,
  };
}
