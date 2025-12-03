"use client";

import { useState, useRef, useEffect, memo } from "react";
import { Eye, Code, Layers } from "lucide-react";

interface LazyComponentPreviewProps {
  html: string;
  css: string;
  javascript: string;
  componentId: string;
}

/**
 * LazyComponentPreview - Renders component preview only when visible in viewport
 * Uses Intersection Observer API for performance optimization
 */
function LazyComponentPreviewComponent({
  html,
  css,
  javascript,
  componentId,
}: LazyComponentPreviewProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Use Intersection Observer to detect when component enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Once visible and rendered, we keep it rendered (no unmounting)
            setHasRendered(true);
          } else if (!hasRendered) {
            // Only hide if we haven't rendered yet
            setIsVisible(false);
          }
        });
      },
      {
        root: null,
        rootMargin: "100px", // Start loading 100px before entering viewport
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [hasRendered]);

  // Generate the HTML content for the iframe
  const generatePreviewHtml = () => {
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
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100%;
      padding: 16px;
      background: #ffffff;
    }
    ${css}
  </style>
</head>
<body>
  ${html}
  <script>
    try {
      ${javascript}
    } catch (e) {
      console.error('Preview JS Error:', e);
    }
  </script>
</body>
</html>`;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-40 bg-gray-50 rounded-lg overflow-hidden border border-gray-200"
    >
      {isVisible || hasRendered ? (
        <iframe
          ref={iframeRef}
          srcDoc={generatePreviewHtml()}
          className="w-full h-full border-0 pointer-events-none"
          sandbox="allow-scripts"
          title={`Preview for ${componentId}`}
          loading="lazy"
        />
      ) : (
        // Placeholder when not visible
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
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export const LazyComponentPreview = memo(LazyComponentPreviewComponent);
