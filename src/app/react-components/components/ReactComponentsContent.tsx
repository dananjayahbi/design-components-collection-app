"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Grid,
  RefreshCw,
  Package,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import ReactComponentCard from "./ReactComponentCard";
import { ReactSkeletonGrid } from "./ReactSkeletonCard";
import { useReactComponents, type ReactComponent } from "../hooks";
import { ConfirmDialog } from "@/components/common";

export default function ReactComponentsContent() {
  const router = useRouter();
  const {
    components,
    isLoading,
    isLoadingMore,
    error,
    pagination,
    refetch,
    searchComponents,
    loadMore,
    deleteComponent,
    searchQuery: currentSearchQuery,
  } = useReactComponents();

  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    componentId: string;
    componentName: string;
  }>({
    isOpen: false,
    componentId: "",
    componentName: "",
  });

  // Ref for infinite scroll sentinel element
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Handle search
  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await searchComponents(searchQuery);
    },
    [searchQuery, searchComponents]
  );

  // Handle open component in sandbox (opens in new tab)
  const handleOpenComponent = useCallback(
    (component: ReactComponent) => {
      // Store the component data in localStorage with the component ID as the key
      localStorage.setItem(`editReactComponent_${component.id}`, JSON.stringify(component));
      // Open in new tab
      window.open(`/save-react-components?edit=${component.id}`, "_blank");
    },
    []
  );

  // Handle edit
  const handleEdit = useCallback(
    (component: ReactComponent) => {
      handleOpenComponent(component);
    },
    [handleOpenComponent]
  );

  // Handle delete confirmation
  const handleDeleteClick = useCallback((id: string, name: string) => {
    setDeleteConfirm({
      isOpen: true,
      componentId: id,
      componentName: name,
    });
  }, []);

  // Handle delete
  const handleDelete = useCallback(async () => {
    const success = await deleteComponent(deleteConfirm.componentId);
    if (success) {
      toast.success("Component deleted successfully!");
    } else {
      toast.error("Failed to delete component");
    }
    setDeleteConfirm({ isOpen: false, componentId: "", componentName: "" });
  }, [deleteComponent, deleteConfirm.componentId]);

  // Navigate to create new component
  const handleCreateNew = () => {
    router.push("/save-react-components");
  };

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current || isLoading || isLoadingMore || !pagination?.hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination?.hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: "100px",
        threshold: 0.1,
      }
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [loadMore, isLoading, isLoadingMore, pagination?.hasMore]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">React Components</h1>
          <p className="text-gray-600 mt-1">
            Browse and manage your saved React components
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create New
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search React components by name or description..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Refresh"
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-5 h-5 text-gray-600 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Results count */}
      {!isLoading && pagination && (
        <div className="text-sm text-gray-500">
          {pagination.totalCount === 0 ? (
            "No components found"
          ) : (
            <>
              Showing {components.length} of {pagination.totalCount} component
              {pagination.totalCount !== 1 ? "s" : ""}
            </>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
          <button
            onClick={() => refetch()}
            className="ml-auto text-sm font-medium hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && <ReactSkeletonGrid />}

      {/* Empty State */}
      {!isLoading && !error && components.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
            <Package className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No React components yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {currentSearchQuery
              ? `No components matching "${currentSearchQuery}". Try a different search term.`
              : "Start building your React component library by creating your first component."}
          </p>
          {!currentSearchQuery && (
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Component
            </button>
          )}
        </div>
      )}

      {/* Components Grid */}
      {!isLoading && !error && components.length > 0 && (
        <>
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {components.map((component) => (
              <ReactComponentCard
                key={component.id}
                component={component}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-4" />

          {/* Loading more indicator */}
          {isLoadingMore && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="ml-2 text-gray-600">Loading more...</span>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() =>
          setDeleteConfirm({ isOpen: false, componentId: "", componentName: "" })
        }
        onConfirm={handleDelete}
        title="Delete Component"
        message={`Are you sure you want to delete "${deleteConfirm.componentName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
