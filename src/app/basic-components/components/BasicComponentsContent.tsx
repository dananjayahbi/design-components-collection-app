"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Grid,
  LayoutGrid,
  RefreshCw,
  Package,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { ComponentCard } from "./ComponentCard";
import { MasonryComponentCard } from "./MasonryComponentCard";
import { SkeletonGrid } from "./SkeletonCard";
import { useBasicComponents, type BasicComponent } from "../hooks";
import { ConfirmDialog } from "@/components/common";

export default function BasicComponentsContent() {
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
  } = useBasicComponents();

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "masonry">("masonry");
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
    (component: BasicComponent) => {
      // Store the component data in localStorage with the component ID as the key
      // This ensures each component can be opened independently in new tabs
      localStorage.setItem(`editComponent_${component.id}`, JSON.stringify(component));
      // Open in new tab
      window.open(`/save-basic-components?edit=${component.id}`, "_blank");
    },
    []
  );

  // Handle edit
  const handleEdit = useCallback(
    (component: BasicComponent) => {
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
    router.push("/save-basic-components");
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
          <h1 className="text-3xl font-bold text-gray-900">Basic Components</h1>
          <p className="text-gray-600 mt-1">
            Browse and manage your saved HTML/CSS/JS components
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B50E8] text-white rounded-lg hover:bg-[#4a41c7] transition-colors"
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
              placeholder="Search components by name or description..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5B50E8] focus:border-transparent transition-all"
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

          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2.5 transition-colors ${
                viewMode === "grid"
                  ? "bg-[#5B50E8] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
              title="Grid View"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("masonry")}
              className={`p-2.5 transition-colors ${
                viewMode === "masonry"
                  ? "bg-[#5B50E8] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
              title="Masonry View"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Component Count */}
      {pagination && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Package className="w-4 h-4" />
          <span>
            Showing {components.length} of {pagination.totalCount} component{pagination.totalCount !== 1 ? "s" : ""}
            {currentSearchQuery && ` matching "${currentSearchQuery}"`}
          </span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
          <button
            onClick={() => refetch()}
            className="ml-auto text-sm font-medium text-red-600 hover:text-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Initial Loading State - Skeleton Cards */}
      {isLoading && (
        <SkeletonGrid count={8} viewMode={viewMode} />
      )}

      {/* Empty State */}
      {!isLoading && !error && components && components.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {currentSearchQuery ? "No components found" : "No components yet"}
          </h3>
          <p className="text-gray-500 text-center mb-6 max-w-md">
            {currentSearchQuery
              ? `No components match your search "${currentSearchQuery}". Try a different search term.`
              : "Get started by creating your first component in the sandbox. Build HTML/CSS/JS components and save them here."
            }
          </p>
          {!currentSearchQuery && (
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#5B50E8] text-white rounded-lg hover:bg-[#4a41c7] transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Component
            </button>
          )}
        </div>
      )}

      {/* Components Grid/Masonry */}
      {!isLoading && !error && components && components.length > 0 && (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {components.map((component) => (
                <ComponentCard
                  key={component.id}
                  component={component}
                  onEdit={handleEdit}
                  onDelete={(id) => handleDeleteClick(id, component.name)}
                  onOpen={handleOpenComponent}
                />
              ))}
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
              {components.map((component) => (
                <MasonryComponentCard
                  key={component.id}
                  component={component}
                  onEdit={handleEdit}
                  onDelete={(id) => handleDeleteClick(id, component.name)}
                  onOpen={handleOpenComponent}
                />
              ))}
            </div>
          )}

          {/* Load More Skeleton Cards when scrolling */}
          {isLoadingMore && (
            <div className="mt-6">
              <SkeletonGrid count={4} viewMode={viewMode} />
            </div>
          )}

          {/* Infinite scroll sentinel */}
          {pagination?.hasMore && !isLoadingMore && (
            <div 
              ref={sentinelRef} 
              className="h-10 flex items-center justify-center"
            >
              <span className="text-sm text-gray-400">Scroll to load more...</span>
            </div>
          )}

          {/* End of results message */}
          {!pagination?.hasMore && components.length > 0 && (
            <div className="py-6 text-center text-sm text-gray-500">
              You&apos;ve reached the end • {pagination?.totalCount} total components
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Component"
        message={`Are you sure you want to delete "${deleteConfirm.componentName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() =>
          setDeleteConfirm({ isOpen: false, componentId: "", componentName: "" })
        }
        danger={true}
      />
    </div>
  );
}
