"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Camera,
  Move,
} from "lucide-react";
import html2canvas from "html2canvas";

interface ThumbnailCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (thumbnailBlob: Blob) => void;
  html: string;
  css: string;
  javascript: string;
  componentName: string;
}

// Minimum and maximum capture sizes
const MIN_SIZE = 100;
const MAX_SIZE = 800;

// Preview container dimensions
const PREVIEW_WIDTH = 800;
const PREVIEW_HEIGHT = 600;

export default function ThumbnailCaptureModal({
  isOpen,
  onClose,
  onCapture,
  html,
  css,
  javascript,
  componentName,
}: ThumbnailCaptureModalProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [captureSize, setCaptureSize] = useState({ width: 300, height: 225 });
  const [isCapturing, setIsCapturing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 300, height: 225, mouseX: 0, mouseY: 0 });
  const [iframeLoaded, setIframeLoaded] = useState(false);
  
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const captureAreaRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hiddenContainerRef = useRef<HTMLDivElement>(null);

  // Create the iframe srcdoc content (same approach as SandboxPreview for proper rendering)
  const srcdoc = useMemo(() => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Reset default styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      padding: 16px;
      background: #ffffff;
      min-height: 100vh;
    }
    /* User CSS */
    ${css}
  </style>
</head>
<body>
  ${html}
  <script>
    try {
      ${javascript}
    } catch (error) {
      console.error('JavaScript Error:', error);
    }
  </script>
</body>
</html>
    `;
  }, [html, css, javascript]);

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    setIframeLoaded(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      // Reset state when modal opens
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setCaptureSize({ width: 300, height: 225 });
      setIframeLoaded(false);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleKeyDown]);

  // Handle zoom
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.3));
  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !isResizing) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && !isResizing) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.mouseX;
      const deltaY = e.clientY - resizeStart.mouseY;
      
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      
      // Handle resize based on which handle is being dragged
      if (isResizing.includes('e')) {
        newWidth = Math.min(MAX_SIZE, Math.max(MIN_SIZE, resizeStart.width + deltaX * 2));
      }
      if (isResizing.includes('w')) {
        newWidth = Math.min(MAX_SIZE, Math.max(MIN_SIZE, resizeStart.width - deltaX * 2));
      }
      if (isResizing.includes('s')) {
        newHeight = Math.min(MAX_SIZE, Math.max(MIN_SIZE, resizeStart.height + deltaY * 2));
      }
      if (isResizing.includes('n')) {
        newHeight = Math.min(MAX_SIZE, Math.max(MIN_SIZE, resizeStart.height - deltaY * 2));
      }
      
      setCaptureSize({ width: Math.round(newWidth), height: Math.round(newHeight) });
    }
  }, [isDragging, isResizing, dragStart, resizeStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(null);
  }, []);

  // Add global mouse event listeners for drag and resize
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(direction);
    setResizeStart({
      width: captureSize.width,
      height: captureSize.height,
      mouseX: e.clientX,
      mouseY: e.clientY,
    });
  };

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.max(0.3, Math.min(3, prev + delta)));
    }
  };

  // Handle manual size input
  const handleSizeChange = (dimension: 'width' | 'height', value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      const clampedValue = Math.min(MAX_SIZE, Math.max(MIN_SIZE, numValue));
      setCaptureSize(prev => ({ ...prev, [dimension]: clampedValue }));
    }
  };

  // Capture thumbnail using fallback method (creates a hidden container and captures it)
  const captureWithFallback = useCallback(async (): Promise<Blob | null> => {
    // Create a temporary hidden container with the content rendered directly
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "-9999px";
    tempContainer.style.width = `${PREVIEW_WIDTH}px`;
    tempContainer.style.height = `${PREVIEW_HEIGHT}px`;
    tempContainer.style.background = "#ffffff";
    tempContainer.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
    tempContainer.style.padding = "16px";
    tempContainer.style.overflow = "hidden";
    tempContainer.style.boxSizing = "border-box";
    
    // Add CSS via style element
    const styleEl = document.createElement("style");
    styleEl.textContent = `
      .temp-capture-container * {
        box-sizing: border-box;
      }
      ${css}
    `;
    tempContainer.appendChild(styleEl);
    
    // Add HTML content
    const contentDiv = document.createElement("div");
    contentDiv.className = "temp-capture-container";
    contentDiv.innerHTML = html;
    tempContainer.appendChild(contentDiv);
    
    document.body.appendChild(tempContainer);
    
    // Wait for styles to apply and fonts to load
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      const canvas = await html2canvas(tempContainer, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
      });
      
      // Calculate capture coordinates
      const captureHalfWidth = captureSize.width / 2;
      const captureHalfHeight = captureSize.height / 2;
      const iframeX = PREVIEW_WIDTH / 2 - position.x / zoom;
      const iframeY = PREVIEW_HEIGHT / 2 - position.y / zoom;
      const captureStartX = iframeX - captureHalfWidth / zoom;
      const captureStartY = iframeY - captureHalfHeight / zoom;
      const captureWidthInIframe = captureSize.width / zoom;
      const captureHeightInIframe = captureSize.height / zoom;
      
      const thumbnailCanvas = document.createElement("canvas");
      thumbnailCanvas.width = captureSize.width;
      thumbnailCanvas.height = captureSize.height;
      const ctx = thumbnailCanvas.getContext("2d");
      
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, captureSize.width, captureSize.height);
        
        const canvasScaleX = canvas.width / PREVIEW_WIDTH;
        const canvasScaleY = canvas.height / PREVIEW_HEIGHT;
        
        const srcX = Math.max(0, captureStartX * canvasScaleX);
        const srcY = Math.max(0, captureStartY * canvasScaleY);
        const srcWidth = captureWidthInIframe * canvasScaleX;
        const srcHeight = captureHeightInIframe * canvasScaleY;
        
        ctx.drawImage(
          canvas,
          srcX,
          srcY,
          srcWidth,
          srcHeight,
          0,
          0,
          captureSize.width,
          captureSize.height
        );
        
        return new Promise((resolve) => {
          thumbnailCanvas.toBlob(
            (blob) => {
              resolve(blob);
            },
            "image/png",
            1.0
          );
        });
      }
      return null;
    } finally {
      document.body.removeChild(tempContainer);
    }
  }, [css, html, captureSize, position, zoom]);

  // Capture thumbnail using the iframe content
  const handleCapture = async () => {
    if (!previewContainerRef.current || !captureAreaRef.current || !iframeRef.current) return;

    setIsCapturing(true);
    try {
      // Wait a moment to ensure content is fully rendered
      await new Promise(resolve => setTimeout(resolve, 300));

      const iframe = iframeRef.current;
      const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
      
      let canvas: HTMLCanvasElement | null = null;
      
      // Try to capture from iframe first
      if (iframeDocument && iframeDocument.body) {
        try {
          canvas = await html2canvas(iframeDocument.body, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            scale: 2, // Higher resolution for quality
            logging: false,
            width: PREVIEW_WIDTH,
            height: PREVIEW_HEIGHT,
            windowWidth: PREVIEW_WIDTH,
            windowHeight: PREVIEW_HEIGHT,
          });
        } catch (iframeError) {
          console.warn("Could not capture iframe directly, using fallback:", iframeError);
        }
      }

      // If iframe capture failed, use fallback
      if (!canvas) {
        const fallbackBlob = await captureWithFallback();
        if (fallbackBlob) {
          onCapture(fallbackBlob);
        }
        return;
      }

      // Calculate the capture coordinates
      const captureHalfWidth = captureSize.width / 2;
      const captureHalfHeight = captureSize.height / 2;
      
      // The center of visible iframe content (in iframe coordinates) based on position
      const iframeCenterInViewX = PREVIEW_WIDTH / 2;
      const iframeCenterInViewY = PREVIEW_HEIGHT / 2;
      
      // In iframe coordinates, container center corresponds to:
      const iframeX = iframeCenterInViewX - position.x / zoom;
      const iframeY = iframeCenterInViewY - position.y / zoom;
      
      // Top-left of capture area in iframe coordinates
      const captureStartX = iframeX - captureHalfWidth / zoom;
      const captureStartY = iframeY - captureHalfHeight / zoom;
      
      // Width and height to capture from iframe (in iframe pixels)
      const captureWidthInIframe = captureSize.width / zoom;
      const captureHeightInIframe = captureSize.height / zoom;

      // Create the final thumbnail canvas
      const thumbnailCanvas = document.createElement("canvas");
      thumbnailCanvas.width = captureSize.width;
      thumbnailCanvas.height = captureSize.height;
      const ctx = thumbnailCanvas.getContext("2d");

      if (ctx) {
        // Fill with white background first
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, captureSize.width, captureSize.height);

        // Calculate scale factor from html2canvas
        const canvasScaleX = canvas.width / PREVIEW_WIDTH;
        const canvasScaleY = canvas.height / PREVIEW_HEIGHT;

        // Source coordinates in the captured canvas
        const srcX = Math.max(0, captureStartX * canvasScaleX);
        const srcY = Math.max(0, captureStartY * canvasScaleY);
        const srcWidth = captureWidthInIframe * canvasScaleX;
        const srcHeight = captureHeightInIframe * canvasScaleY;

        // Draw the cropped area to the thumbnail canvas
        ctx.drawImage(
          canvas,
          srcX,
          srcY,
          srcWidth,
          srcHeight,
          0,
          0,
          captureSize.width,
          captureSize.height
        );

        // Convert to blob
        thumbnailCanvas.toBlob(
          (blob) => {
            if (blob) {
              onCapture(blob);
            }
          },
          "image/png",
          1.0
        );
      }
    } catch (error) {
      console.error("Failed to capture thumbnail:", error);
      
      // Fallback: Try a simpler capture method
      try {
        const fallbackBlob = await captureWithFallback();
        if (fallbackBlob) {
          onCapture(fallbackBlob);
        }
      } catch (fallbackError) {
        console.error("Fallback capture also failed:", fallbackError);
      }
    } finally {
      setIsCapturing(false);
    }
  };

  if (!isOpen) return null;

  // Resize handle styles
  const resizeHandleClass = "absolute bg-[#5B50E8] hover:bg-[#7b72ff] transition-colors z-10";
  const cornerHandleClass = `${resizeHandleClass} w-3 h-3 rounded-sm`;
  const edgeHandleClass = resizeHandleClass;

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-[95vw] h-[90vh] bg-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Camera className="w-5 h-5 text-[#5B50E8]" />
            <span className="text-white font-semibold text-lg">
              Capture Thumbnail
            </span>
            <span className="text-gray-400 text-sm">- {componentName}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 text-white" />
            </button>
            <span className="text-white text-sm min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors ml-2"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4 text-white" />
            </button>
            <div className="flex items-center gap-1 ml-4 text-gray-400 text-xs">
              <Move className="w-3 h-3" />
              <span>Drag to pan • Ctrl+Scroll to zoom</span>
            </div>
          </div>

          {/* Thumbnail Size Input */}
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">Capture Size:</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={captureSize.width}
                onChange={(e) => handleSizeChange('width', e.target.value)}
                min={MIN_SIZE}
                max={MAX_SIZE}
                className="w-16 bg-gray-700 text-white text-sm px-2 py-1.5 rounded-lg border border-gray-600 focus:ring-2 focus:ring-[#5B50E8] focus:border-transparent text-center"
              />
              <span className="text-gray-400">×</span>
              <input
                type="number"
                value={captureSize.height}
                onChange={(e) => handleSizeChange('height', e.target.value)}
                min={MIN_SIZE}
                max={MAX_SIZE}
                className="w-16 bg-gray-700 text-white text-sm px-2 py-1.5 rounded-lg border border-gray-600 focus:ring-2 focus:ring-[#5B50E8] focus:border-transparent text-center"
              />
              <span className="text-gray-500 text-xs ml-1">px</span>
            </div>
            <span className="text-gray-500 text-xs">(drag corners to resize)</span>
          </div>
        </div>

        {/* Preview Area with Capture Frame */}
        <div
          ref={previewContainerRef}
          className="flex-1 relative overflow-hidden bg-gray-700"
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
          style={{ cursor: isDragging ? "grabbing" : isResizing ? "nwse-resize" : "grab" }}
        >
          {/* Iframe Preview Container */}
          <div
            className="absolute bg-white overflow-hidden"
            style={{
              width: `${PREVIEW_WIDTH}px`,
              height: `${PREVIEW_HEIGHT}px`,
              left: `calc(50% + ${position.x}px)`,
              top: `calc(50% + ${position.y}px)`,
              transform: `translate(-50%, -50%) scale(${zoom})`,
              transformOrigin: "center center",
            }}
          >
            <iframe
              ref={iframeRef}
              title="Thumbnail Preview"
              srcDoc={srcdoc}
              onLoad={handleIframeLoad}
              className="w-full h-full border-0"
              style={{ pointerEvents: "none" }}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>

          {/* Capture Area Overlay with Resize Handles */}
          <div
            ref={captureAreaRef}
            className="absolute"
            style={{
              width: captureSize.width,
              height: captureSize.height,
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Clear area border */}
            <div className="w-full h-full border-2 border-[#5B50E8] bg-transparent pointer-events-none" />
            
            {/* Corner Resize Handles */}
            <div
              className={`${cornerHandleClass} -top-1.5 -left-1.5 cursor-nwse-resize`}
              onMouseDown={(e) => handleResizeStart(e, 'nw')}
            />
            <div
              className={`${cornerHandleClass} -top-1.5 -right-1.5 cursor-nesw-resize`}
              onMouseDown={(e) => handleResizeStart(e, 'ne')}
            />
            <div
              className={`${cornerHandleClass} -bottom-1.5 -left-1.5 cursor-nesw-resize`}
              onMouseDown={(e) => handleResizeStart(e, 'sw')}
            />
            <div
              className={`${cornerHandleClass} -bottom-1.5 -right-1.5 cursor-nwse-resize`}
              onMouseDown={(e) => handleResizeStart(e, 'se')}
            />
            
            {/* Edge Resize Handles */}
            <div
              className={`${edgeHandleClass} top-1/2 -left-1 -translate-y-1/2 w-2 h-8 rounded-sm cursor-ew-resize`}
              onMouseDown={(e) => handleResizeStart(e, 'w')}
            />
            <div
              className={`${edgeHandleClass} top-1/2 -right-1 -translate-y-1/2 w-2 h-8 rounded-sm cursor-ew-resize`}
              onMouseDown={(e) => handleResizeStart(e, 'e')}
            />
            <div
              className={`${edgeHandleClass} -top-1 left-1/2 -translate-x-1/2 w-8 h-2 rounded-sm cursor-ns-resize`}
              onMouseDown={(e) => handleResizeStart(e, 'n')}
            />
            <div
              className={`${edgeHandleClass} -bottom-1 left-1/2 -translate-x-1/2 w-8 h-2 rounded-sm cursor-ns-resize`}
              onMouseDown={(e) => handleResizeStart(e, 's')}
            />
            
            {/* Size label */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#5B50E8] text-white text-xs rounded pointer-events-none">
              {captureSize.width} × {captureSize.height}
            </div>
          </div>

          {/* Shadow overlay outside capture area */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                linear-gradient(to right, rgba(0,0,0,0.6) calc(50% - ${captureSize.width / 2}px), transparent calc(50% - ${captureSize.width / 2}px), transparent calc(50% + ${captureSize.width / 2}px), rgba(0,0,0,0.6) calc(50% + ${captureSize.width / 2}px)),
                linear-gradient(to bottom, rgba(0,0,0,0.6) calc(50% - ${captureSize.height / 2}px), transparent calc(50% - ${captureSize.height / 2}px), transparent calc(50% + ${captureSize.height / 2}px), rgba(0,0,0,0.6) calc(50% + ${captureSize.height / 2}px))
              `,
            }}
          />

          {/* Loading indicator */}
          {!iframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50">
              <div className="text-white text-sm">Loading preview...</div>
            </div>
          )}
        </div>

        {/* Hidden container for fallback capture */}
        <div ref={hiddenContainerRef} style={{ display: 'none' }} />

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-800 border-t border-gray-700 flex items-center justify-between">
          <span className="text-gray-400 text-sm">
            Drag edges or corners to resize the capture area freely
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCapture}
              disabled={isCapturing || !iframeLoaded}
              className="flex items-center gap-2 px-6 py-2 bg-[#5B50E8] text-white rounded-lg hover:bg-[#4a41c7] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-4 h-4" />
              {isCapturing ? "Capturing..." : "Capture Thumbnail"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
