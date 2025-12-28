"use client";

import { useState, memo } from "react";
import {
  Edit,
  Trash2,
  ExternalLink,
  Tag,
  Calendar,
  MoreVertical,
  Copy,
  Check,
} from "lucide-react";
import { ThumbnailPlaceholder } from "./ThumbnailPlaceholder";
import type { BasicComponent } from "../hooks/useBasicComponents";

interface ComponentCardProps {
  component: BasicComponent;
  onEdit?: (component: BasicComponent) => void;
  onDelete?: (id: string) => void;
  onOpen?: (component: BasicComponent) => void;
}

function ComponentCardComponent({
  component,
  onEdit,
  onDelete,
  onOpen,
}: ComponentCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);

  // Check if component has a valid thumbnail
  const hasThumbnail = component.thumbnailUrl && !thumbnailError;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleCopyCode = async () => {
    const fullCode = `<!-- HTML -->\n${component.html}\n\n/* CSS */\n${component.css}\n\n// JavaScript\n${component.javascript}`;
    try {
      await navigator.clipboard.writeText(fullCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-[#5B50E8]/50 hover:shadow-lg transition-all duration-300">
      {/* Preview Area - Shows thumbnail if available, otherwise shows placeholder */}
      <div className="relative h-48 bg-white overflow-hidden">
        {hasThumbnail ? (
          /* Thumbnail Display */
          <img
            src={component.thumbnailUrl!}
            alt={`Preview of ${component.name}`}
            className="w-full h-full object-contain"
            loading="lazy"
            onError={() => setThumbnailError(true)}
          />
        ) : (
          /* Placeholder when no thumbnail available */
          <ThumbnailPlaceholder name={component.name} className="h-full" />
        )}

        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            onClick={() => onOpen?.(component)}
            className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            title="Open in Sandbox"
          >
            <ExternalLink className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={handleCopyCode}
            className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            title="Copy Code"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4 text-gray-700" />
            )}
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(component)}
              className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
              title="Edit"
            >
              <Edit className="w-4 h-4 text-gray-700" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-1">
            {component.name}
          </h3>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
                  <button
                    onClick={() => {
                      onOpen?.(component);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open
                  </button>
                  <button
                    onClick={() => {
                      handleCopyCode();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Code
                  </button>
                  {onEdit && (
                    <button
                      onClick={() => {
                        onEdit(component);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        onDelete(component.id);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {component.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {component.description}
          </p>
        )}

        {/* Tags */}
        {component.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {component.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#5B50E8]/10 text-[#5B50E8] rounded-full text-xs"
              >
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
            {component.tags.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                +{component.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(component.createdAt)}
          </div>
          {component.isFavorite && (
            <span className="text-yellow-500">★ Favorite</span>
          )}
        </div>
      </div>
    </div>
  );
}

export const ComponentCard = memo(ComponentCardComponent);
