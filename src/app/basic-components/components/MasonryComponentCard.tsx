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
} from "lucide-react";
import type { BasicComponent } from "../hooks/useBasicComponents";

interface MasonryComponentCardProps {
  component: BasicComponent;
  onEdit?: (component: BasicComponent) => void;
  onDelete?: (id: string) => void;
  onOpen?: (component: BasicComponent) => void;
}

// Fixed column width in pixels (based on 3 columns layout)
const COLUMN_WIDTH = 350;

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
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, scale: 1 });
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  // Calculate optimal scale based on content dimensions
  const calculateScale = useCallback((contentWidth: number, contentHeight: number) => {
    // Get the actual container width (column width)
    const containerWidth = containerRef.current?.offsetWidth || COLUMN_WIDTH;
    
    // Calculate scale to fit width (with some padding)
    const availableWidth = containerWidth - 8; // 4px padding on each side
    const scaleX = availableWidth / contentWidth;
    
    // Limit scale: don't enlarge small components, but allow shrinking large ones
    // Minimum scale: 0.2 (for very large content like full pages)
    // Maximum scale: 1.0 (never enlarge beyond original)
    const scale = Math.min(Math.max(scaleX, 0.2), 1.0);
    
    // Calculate the scaled height
    const scaledHeight = contentHeight * scale;
    
    // Set minimum and maximum display heights
    const minHeight = 100;
    const maxHeight = 600;
    const displayHeight = Math.min(Math.max(scaledHeight, minHeight), maxHeight);
    
    return {
      width: contentWidth,
      height: contentHeight,
      scale,
      displayHeight,
    };
  }, []);

  // Generate the HTML content for the iframe with proper sizing
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
    html {
      width: max-content;
      min-width: 100%;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: inline-block;
      min-width: 100%;
      padding: 16px;
      background: #ffffff;
    }
    ${component.css}
  </style>
</head>
<body>
  ${component.html}
  <script>
    // Send dimensions to parent after content renders
    function sendDimensions() {
      // Get the bounding rect of the body content
      const body = document.body;
      const width = Math.max(
        body.scrollWidth,
        body.offsetWidth,
        document.documentElement.scrollWidth
      );
      const height = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        document.documentElement.scrollHeight
      );
      
      window.parent.postMessage({ 
        type: 'dimensions', 
        width: width,
        height: height,
        id: '${component.id}' 
      }, '*');
    }
    
    // Send dimensions after content loads
    window.addEventListener('load', () => {
      requestAnimationFrame(() => {
        setTimeout(sendDimensions, 50);
      });
    });
    
    // Also send dimensions when images load
    document.querySelectorAll('img').forEach(img => {
      img.addEventListener('load', sendDimensions);
    });
    
    // Initial send
    if (document.readyState === 'complete') {
      requestAnimationFrame(() => {
        setTimeout(sendDimensions, 50);
      });
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

  // Listen for dimension messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data?.type === "dimensions" &&
        event.data?.id === component.id
      ) {
        const { width, height } = event.data;
        const { scale, displayHeight } = calculateScale(width, height);
        
        setDimensions({
          width,
          height,
          scale,
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [component.id, calculateScale]);

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

  // Calculate display dimensions
  const scaledHeight = dimensions.height > 0 
    ? Math.min(Math.max(dimensions.height * dimensions.scale, 100), 600)
    : 200;

  return (
    <div
      ref={containerRef}
      className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-[#5B50E8]/50 hover:shadow-xl transition-all duration-300 break-inside-avoid mb-4"
    >
      {/* Preview Area - Dynamic height based on content */}
      <div
        className="relative bg-gray-50 overflow-hidden"
        style={{ height: `${scaledHeight}px` }}
      >
        {isVisible || hasRendered ? (
          <div className="w-full h-full relative overflow-hidden">
            {/* Dynamically scaled iframe container */}
            <div 
              className="absolute origin-top-left"
              style={{
                width: dimensions.width > 0 ? `${dimensions.width}px` : "200%",
                height: dimensions.height > 0 ? `${dimensions.height}px` : "200%",
                transform: `scale(${dimensions.scale || 0.5})`,
                transformOrigin: "top left",
              }}
            >
              <iframe
                ref={iframeRef}
                srcDoc={generatePreviewHtml()}
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts"
                title={`Preview for ${component.name}`}
                loading="lazy"
              />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-50 to-gray-100">
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

        {/* Scale indicator */}
        {dimensions.scale < 1 && dimensions.scale > 0 && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/50 text-white text-xs rounded z-10">
            {Math.round(dimensions.scale * 100)}%
          </div>
        )}
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

export const MasonryComponentCard = memo(MasonryComponentCardComponent);
