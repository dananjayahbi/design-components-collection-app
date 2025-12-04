"use client";

import { useState, useRef, useEffect, memo, useCallback } from "react";
import {
  Edit,
  Trash2,
  ExternalLink,
  Tag,
  Calendar,
  MoreVertical,
  Copy,
  Check,
  Eye,
  Layers,
  ImageOff,
} from "lucide-react";
import type { BasicComponent } from "../hooks/useBasicComponents";

interface MasonryComponentCardProps {
  component: BasicComponent;
  onEdit?: (component: BasicComponent) => void;
  onDelete?: (id: string) => void;
  onOpen?: (component: BasicComponent) => void;
}

// Height constraints for the preview area (used for fallback iframe)
const MIN_PREVIEW_HEIGHT = 150;
const MAX_PREVIEW_HEIGHT = 600;
// Fixed height for thumbnail display
const THUMBNAIL_HEIGHT = 200;

function MasonryComponentCardComponent({
  component,
  onEdit,
  onDelete,
  onOpen,
}: MasonryComponentCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);
  const [previewHeight, setPreviewHeight] = useState(MIN_PREVIEW_HEIGHT);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [thumbnailError, setThumbnailError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

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

  // Use Intersection Observer to detect when component enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            setHasRendered(true);
          }
        });
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Generate the HTML content for the iframe
  const generatePreviewHtml = useCallback(() => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 100%;
      overflow: hidden;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 16px;
      background: #ffffff;
    }
    ${component.css}
  </style>
</head>
<body>
  ${component.html}
  <script>
    // Send content height to parent
    function sendHeight() {
      const height = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.scrollHeight
      );
      window.parent.postMessage({ 
        type: 'contentHeight', 
        height: height,
        id: '${component.id}' 
      }, '*');
    }
    
    // Send height after load
    window.addEventListener('load', () => {
      requestAnimationFrame(() => setTimeout(sendHeight, 100));
    });
    
    // Images
    document.querySelectorAll('img').forEach(img => {
      img.addEventListener('load', sendHeight);
    });
    
    if (document.readyState === 'complete') {
      requestAnimationFrame(() => setTimeout(sendHeight, 100));
    }
    
    try {
      ${component.javascript}
    } catch (e) {
      console.error('Preview JS Error:', e);
    }
  </script>
</body>
</html>`;
  }, [component.css, component.html, component.javascript, component.id]);

  // Listen for height messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data?.type === "contentHeight" &&
        event.data?.id === component.id
      ) {
        const height = event.data.height;
        // Clamp height between MIN and MAX
        const clampedHeight = Math.min(MAX_PREVIEW_HEIGHT, Math.max(MIN_PREVIEW_HEIGHT, height));
        setPreviewHeight(clampedHeight);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [component.id]);

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

  // Handle menu toggle with position calculation
  const handleMenuToggle = useCallback(() => {
    if (!showMenu && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4, // 4px gap below the button
        left: rect.right - 140, // Align right edge (140px is min-w-[140px])
      });
    }
    setShowMenu(!showMenu);
  }, [showMenu]);

  return (
    <div
      ref={containerRef}
      className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-[#5B50E8]/50 hover:shadow-xl transition-all duration-300 break-inside-avoid mb-4"
    >
      {/* Preview Area - Shows thumbnail if available, otherwise falls back to iframe */}
      <div
        className="relative bg-white overflow-hidden"
        style={{ height: hasThumbnail ? `${THUMBNAIL_HEIGHT}px` : `${previewHeight}px` }}
      >
        {hasThumbnail ? (
          /* Thumbnail Display */
          <img
            src={component.thumbnailUrl!}
            alt={`Preview of ${component.name}`}
            className="w-full h-full object-cover object-top"
            loading="lazy"
            onError={() => setThumbnailError(true)}
          />
        ) : isVisible || hasRendered ? (
          <iframe
            ref={iframeRef}
            srcDoc={generatePreviewHtml()}
            className="w-full h-full border-0 bg-white"
            sandbox="allow-scripts"
            title={`Preview for ${component.name}`}
            loading="lazy"
            style={{
              pointerEvents: "none", // Prevent iframe from capturing events
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-50">
            <div className="flex items-center gap-1 text-gray-400">
              <Layers className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Eye className="w-3 h-3" />
              <span>Preview loads on scroll</span>
            </div>
          </div>
        )}

        {/* Overlay Actions on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto z-10">
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
              ref={menuButtonRef}
              onClick={handleMenuToggle}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>

            {/* Dropdown Menu - Fixed position to escape overflow:hidden */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-999"
                  onClick={() => setShowMenu(false)}
                />
                <div 
                  className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-1000 py-1 min-w-[140px]"
                  style={{ top: menuPosition.top, left: menuPosition.left }}
                >
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

export const MasonryComponentCard = memo(MasonryComponentCardComponent);
