"use client";

import { X, Download, Trash2 } from "lucide-react";

interface ImageRecord {
  Timestamp: string;
  ImagePath: string;
  Prompt: string;
  Model: string;
  AspectRatio: string;
}

interface ImageLightboxProps {
  image: ImageRecord;
  imageUrl: string;
  onClose: () => void;
  onDelete: (imagePath: string) => void;
  onDownload: (imagePath: string) => void;
}

export function ImageLightbox({
  image,
  imageUrl,
  onClose,
  onDelete,
  onDownload,
}: ImageLightboxProps) {
  return (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-7xl max-h-[90vh] bg-white rounded-lg overflow-hidden flex flex-col lg:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Details Section - Left Side */}
        <div className="lg:w-2/5 p-6 bg-gray-50 overflow-y-auto flex flex-col">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 pr-12">
            Image Details
          </h2>

          {/* Prompt */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Prompt
            </h3>
            <p className="text-gray-800 leading-relaxed">{image.Prompt}</p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 gap-4 mb-6">
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-1">Model</p>
              <p className="font-medium text-gray-900">{image.Model}</p>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-1">Aspect Ratio</p>
              <p className="font-medium text-gray-900">{image.AspectRatio}</p>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-1">Generated</p>
              <p className="font-medium text-gray-900">
                {new Date(image.Timestamp).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-1">File Name</p>
              <p className="font-medium text-gray-900 text-xs break-all">
                {image.ImagePath.split("/").pop()}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-auto pt-6 border-t flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onDownload(image.ImagePath)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#5B50E8] text-white rounded-lg hover:bg-[#4840C0] transition-colors font-medium"
            >
              <Download className="w-5 h-5" />
              Download
            </button>
            <button
              onClick={() => onDelete(image.ImagePath)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              <Trash2 className="w-5 h-5" />
              Delete
            </button>
          </div>
        </div>

        {/* Image Section - Right Side */}
        <div className="lg:w-3/5 bg-white flex items-center justify-center p-6 lg:p-8">
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={imageUrl}
              alt={image.Prompt}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
