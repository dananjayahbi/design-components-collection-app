"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { ImageLightbox } from "./ImageLightbox";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

interface ImageRecord {
  Timestamp: string;
  ImagePath: string;
  Prompt: string;
  Model: string;
  AspectRatio: string;
}

interface ImageListResponse {
  images: ImageRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function BackgroundsView() {
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    imagePath: string | null;
  }>({ isOpen: false, imagePath: null });
  const limit = 12;

  useEffect(() => {
    fetchImages();
  }, [page]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching images, page:", page, "limit:", limit);
      
      const response = await fetch(`/api/images/list?page=${page}&limit=${limit}`);
      console.log("📡 Response status:", response.status, response.statusText);
      console.log("📡 Response headers:", Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        // Try to get response text first
        const responseText = await response.text();
        console.error("Response text:", responseText);
        
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { message: `HTTP ${response.status}: ${responseText.substring(0, 200)}` };
        }
        
        console.error("API error:", errorData);
        throw new Error(errorData.message || "Failed to fetch images");
      }

      const data: ImageListResponse = await response.json();
      console.log(" Received data:", data);
      setImages(data.images);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error(" Error fetching images:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath: string) => {
    // Extract filename from path like "src/assets/gen-images/uuid.jpg"
    const filename = imagePath.split("/").pop();
    const url = `/api/images/${filename}`;
    console.log("🖼️ Image URL:", imagePath, "→", url);
    return url;
  };

  const getGridRowSpan = (aspectRatio: string): number => {
    // Calculate row span based on aspect ratio for masonry effect
    switch (aspectRatio) {
      case "1:1":
        return 1; // Square - 1 row
      case "4:3":
        return 1; // Landscape - 1 row (slightly wider)
      case "3:4":
        return 2; // Portrait - 2 rows (taller)
      case "9:16":
        return 3; // Tall portrait - 3 rows (very tall)
      default:
        return 1;
    }
  };

  const handleDelete = async (imagePath: string) => {
    setDeleteConfirm({ isOpen: true, imagePath });
  };

  const confirmDelete = async () => {
    const { imagePath } = deleteConfirm;
    if (!imagePath) return;

    try {
      const response = await fetch(`/api/images/delete?path=${encodeURIComponent(imagePath)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete image");
      }

      toast.success("Image deleted successfully");
      fetchImages();
      setSelectedImage(null);
      setDeleteConfirm({ isOpen: false, imagePath: null });
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Failed to delete image");
      setDeleteConfirm({ isOpen: false, imagePath: null });
    }
  };

  const handleDownload = (imagePath: string) => {
    const link = document.createElement("a");
    link.href = getImageUrl(imagePath);
    link.download = imagePath.split("/").pop() || "image.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && images.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading images...</div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <p className="text-lg">No saved backgrounds yet</p>
        <p className="text-sm mt-2">Generate and save some backgrounds to see them here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gallery Grid - Masonry Layout */}
      <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        {images.map((image, index) => (
          <div
            key={`${image.ImagePath}-${index}`}
            className="break-inside-avoid mb-6"
          >
            <div
              className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => setSelectedImage(image)}
            >
              {/* Image with natural aspect ratio */}
              <div className="relative w-full bg-gray-100">
                <img
                  src={getImageUrl(image.ImagePath)}
                  alt={image.Prompt}
                  className="w-full h-auto"
                />
              </div>
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="text-white text-center p-4">
                  <p className="text-sm line-clamp-3">{image.Prompt}</p>
                </div>
              </div>

              {/* Info bar */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                <p className="text-xs text-white truncate font-medium">
                  {new Date(image.Timestamp).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-200 truncate mt-1">
                  {image.AspectRatio} • {image.Model.split('-').slice(0, 3).join('-')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <ImageLightbox
          image={selectedImage}
          imageUrl={getImageUrl(selectedImage.ImagePath)}
          onClose={() => setSelectedImage(null)}
          onDelete={handleDelete}
          onDownload={handleDownload}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Image?"
        message="Are you sure you want to delete this image? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, imagePath: null })}
        danger
      />
    </div>
  );
}

