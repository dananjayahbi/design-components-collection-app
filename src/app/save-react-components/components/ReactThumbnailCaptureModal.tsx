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
import { generateSandboxHtml } from "@/lib/constants/reactDependencies";

interface ReactThumbnailCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (thumbnailBlob: Blob) => void;
  componentCode: string;
  cssCode: string;
  dependencies?: string[];
  componentName: string;
}

// Minimum and maximum capture sizes
const MIN_SIZE = 100;
const MAX_SIZE = 800;

// Preview container dimensions
const PREVIEW_WIDTH = 800;
const PREVIEW_HEIGHT = 600;

export default function ReactThumbnailCaptureModal({
  isOpen,
  onClose,
  onCapture,
  componentCode,
  cssCode,
  dependencies = [],
  componentName,
}: ReactThumbnailCaptureModalProps) {
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

  // Create the iframe srcdoc content with React runtime and dependencies
  const srcdoc = useMemo(() => {
    return generateSandboxHtml(componentCode, cssCode, dependencies);
  }, [componentCode, cssCode, dependencies]);

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

  // Capture thumbnail
  const handleCapture = async () => {
    if (!iframeRef.current || !hiddenContainerRef.current || !captureAreaRef.current) return;
    
    setIsCapturing(true);
    
    try {
      // Get the iframe's document
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (!iframeDoc) throw new Error("Cannot access iframe content");
      
      // Clone the body content
      const bodyClone = iframeDoc.body.cloneNode(true) as HTMLElement;
      
      // Get computed styles from iframe
      const styles = iframeDoc.head.querySelectorAll('style');
      let styleContent = '';
      styles.forEach(style => {
        styleContent += style.textContent || '';
      });
      
      // Create a hidden container for rendering
      const hiddenContainer = hiddenContainerRef.current;
      hiddenContainer.innerHTML = '';
      
      // Apply styles
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
        ${styleContent}
      `;
      hiddenContainer.appendChild(styleElement);
      
      // Create wrapper div with proper sizing
      const wrapper = document.createElement('div');
      wrapper.style.width = `${captureSize.width}px`;
      wrapper.style.height = `${captureSize.height}px`;
      wrapper.style.overflow = 'hidden';
      wrapper.style.background = '#ffffff';
      wrapper.style.padding = '16px';
      wrapper.style.transform = `scale(${zoom})`;
      wrapper.style.transformOrigin = 'top left';
      
      wrapper.innerHTML = bodyClone.innerHTML;
      hiddenContainer.appendChild(wrapper);
      
      // Use html2canvas to capture
      const canvas = await html2canvas(wrapper, {
        width: captureSize.width,
        height: captureSize.height,
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        }, 'image/png', 0.95);
      });
      
      onCapture(blob);
      onClose();
    } catch (error) {
      console.error("Error capturing thumbnail:", error);
      // Fallback: capture the visible area using html2canvas on the capture frame
      try {
        const captureArea = captureAreaRef.current;
        const canvas = await html2canvas(captureArea, {
          width: captureSize.width,
          height: captureSize.height,
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        });
        
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to create blob"));
          }, 'image/png', 0.95);
        });
        
        onCapture(blob);
        onClose();
      } catch (fallbackError) {
        console.error("Fallback capture also failed:", fallbackError);
      }
    } finally {
      setIsCapturing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Hidden container for thumbnail capture */}
      <div 
        ref={hiddenContainerRef}
        style={{ 
          position: 'absolute', 
          left: '-9999px', 
          top: '-9999px',
          width: `${captureSize.width}px`,
          height: `${captureSize.height}px`,
        }}
      />

      {/* Modal Content */}
      <div className="relative w-[95vw] max-w-5xl bg-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-emerald-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="w-5 h-5 text-white" />
            <span className="text-white font-semibold text-lg">Capture Thumbnail</span>
            <span className="text-white/70 text-sm">- {componentName}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-4">
            {/* Zoom controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4 text-gray-300" />
              </button>
              <span className="text-gray-300 text-sm min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4 text-gray-300" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Reset View"
              >
                <RotateCcw className="w-4 h-4 text-gray-300" />
              </button>
            </div>
            
            {/* Size display */}
            <div className="text-gray-400 text-sm">
              Capture Size: {captureSize.width} × {captureSize.height}px
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Move className="w-4 h-4" />
            <span>Drag to pan • Resize corners to adjust capture area</span>
          </div>
        </div>

        {/* Preview Area */}
        <div
          ref={previewContainerRef}
          className="relative bg-gray-950 overflow-hidden"
          style={{ height: PREVIEW_HEIGHT }}
          onMouseDown={handleMouseDown}
        >
          {/* Checkered background pattern */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(45deg, #1a1a1a 25%, transparent 25%),
                linear-gradient(-45deg, #1a1a1a 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #1a1a1a 75%),
                linear-gradient(-45deg, transparent 75%, #1a1a1a 75%)
              `,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            }}
          />

          {/* Iframe with the React component */}
          <div
            className="absolute bg-white"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              width: PREVIEW_WIDTH,
              height: PREVIEW_HEIGHT,
              left: `calc(50% - ${PREVIEW_WIDTH / 2}px)`,
              top: `calc(50% - ${PREVIEW_HEIGHT / 2}px)`,
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
          >
            <iframe
              ref={iframeRef}
              title="Thumbnail Preview"
              className="w-full h-full"
              srcDoc={srcdoc}
              sandbox="allow-scripts allow-same-origin"
              onLoad={handleIframeLoad}
            />
          </div>

          {/* Capture area overlay */}
          <div
            ref={captureAreaRef}
            className="absolute border-2 border-emerald-400 bg-emerald-400/10 pointer-events-auto"
            style={{
              width: captureSize.width,
              height: captureSize.height,
              left: `calc(50% - ${captureSize.width / 2}px)`,
              top: `calc(50% - ${captureSize.height / 2}px)`,
            }}
          >
            {/* Resize handles */}
            {['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map((dir) => (
              <div
                key={dir}
                className="absolute w-3 h-3 bg-emerald-400 border border-white rounded-sm"
                style={{
                  cursor: `${dir}-resize`,
                  ...(dir.includes('n') && { top: -6 }),
                  ...(dir.includes('s') && { bottom: -6 }),
                  ...(dir.includes('e') && { right: -6 }),
                  ...(dir.includes('w') && { left: -6 }),
                  ...(dir === 'n' && { left: '50%', transform: 'translateX(-50%)' }),
                  ...(dir === 's' && { left: '50%', transform: 'translateX(-50%)' }),
                  ...(dir === 'e' && { top: '50%', transform: 'translateY(-50%)' }),
                  ...(dir === 'w' && { top: '50%', transform: 'translateY(-50%)' }),
                }}
                onMouseDown={(e) => handleResizeStart(e, dir)}
              />
            ))}

            {/* Corner labels */}
            <div className="absolute -top-6 left-0 text-xs text-emerald-400">
              {captureSize.width} × {captureSize.height}
            </div>
          </div>

          {/* Dark overlay outside capture area */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top */}
            <div
              className="absolute bg-black/50"
              style={{
                top: 0,
                left: 0,
                right: 0,
                height: `calc(50% - ${captureSize.height / 2}px)`,
              }}
            />
            {/* Bottom */}
            <div
              className="absolute bg-black/50"
              style={{
                bottom: 0,
                left: 0,
                right: 0,
                height: `calc(50% - ${captureSize.height / 2}px)`,
              }}
            />
            {/* Left */}
            <div
              className="absolute bg-black/50"
              style={{
                top: `calc(50% - ${captureSize.height / 2}px)`,
                left: 0,
                width: `calc(50% - ${captureSize.width / 2}px)`,
                height: captureSize.height,
              }}
            />
            {/* Right */}
            <div
              className="absolute bg-black/50"
              style={{
                top: `calc(50% - ${captureSize.height / 2}px)`,
                right: 0,
                width: `calc(50% - ${captureSize.width / 2}px)`,
                height: captureSize.height,
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-700">
          <span className="text-gray-400 text-sm">
            The selected area will be captured as the thumbnail
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCapture}
              disabled={isCapturing || !iframeLoaded}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
