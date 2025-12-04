"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Camera,
  Move,
  Maximize2,
  Minimize2,
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

// Preset thumbnail sizes
const THUMBNAIL_SIZES = [
  { label: "Small", width: 200, height: 150 },
  { label: "Medium", width: 300, height: 225 },
  { label: "Large", width: 400, height: 300 },
  { label: "Wide", width: 400, height: 200 },
  { label: "Square", width: 300, height: 300 },
];

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
  const [captureSize, setCaptureSize] = useState(THUMBNAIL_SIZES[1]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const previewRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const captureAreaRef = useRef<HTMLDivElement>(null);

  // Generate the srcdoc content
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
    html, body {
      width: 100%;
      height: 100%;
      overflow: auto;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      padding: 16px;
      background: #ffffff;
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

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      // Reset state when modal opens
      setZoom(1);
      setPosition({ x: 0, y: 0 });
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
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.max(0.3, Math.min(3, prev + delta)));
    }
  };

  // Capture thumbnail
  const handleCapture = async () => {
    if (!previewRef.current || !captureAreaRef.current) return;

    setIsCapturing(true);
    try {
      // Get the capture area's bounding rect relative to the preview container
      const captureRect = captureAreaRef.current.getBoundingClientRect();
      const previewRect = previewRef.current.getBoundingClientRect();

      // Calculate the position relative to the preview
      const x = captureRect.left - previewRect.left;
      const y = captureRect.top - previewRect.top;

      // Use html2canvas to capture the entire preview area
      const canvas = await html2canvas(previewRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        scale: 2, // Higher resolution
        logging: false,
      });

      // Create a new canvas for the cropped area
      const croppedCanvas = document.createElement("canvas");
      croppedCanvas.width = captureSize.width;
      croppedCanvas.height = captureSize.height;
      const ctx = croppedCanvas.getContext("2d");

      if (ctx) {
        // Calculate the scale factor used by html2canvas
        const scaleX = canvas.width / previewRect.width;
        const scaleY = canvas.height / previewRect.height;

        // Draw the cropped area
        ctx.drawImage(
          canvas,
          x * scaleX,
          y * scaleY,
          captureSize.width * scaleX,
          captureSize.height * scaleY,
          0,
          0,
          captureSize.width,
          captureSize.height
        );

        // Convert to blob
        croppedCanvas.toBlob(
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
    } finally {
      setIsCapturing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
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

          {/* Thumbnail Size Selector */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Thumbnail Size:</span>
            <select
              value={`${captureSize.width}x${captureSize.height}`}
              onChange={(e) => {
                const [w, h] = e.target.value.split("x").map(Number);
                setCaptureSize({ label: "", width: w, height: h });
              }}
              className="bg-gray-700 text-white text-sm px-3 py-1.5 rounded-lg border border-gray-600 focus:ring-2 focus:ring-[#5B50E8] focus:border-transparent"
            >
              {THUMBNAIL_SIZES.map((size) => (
                <option
                  key={`${size.width}x${size.height}`}
                  value={`${size.width}x${size.height}`}
                >
                  {size.label} ({size.width}×{size.height})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Preview Area with Capture Frame */}
        <div
          className="flex-1 relative overflow-hidden bg-gray-700"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
          {/* Preview Container */}
          <div
            ref={previewRef}
            className="absolute bg-white"
            style={{
              width: "800px",
              height: "600px",
              left: `calc(50% + ${position.x}px)`,
              top: `calc(50% + ${position.y}px)`,
              transform: `translate(-50%, -50%) scale(${zoom})`,
              transformOrigin: "center center",
            }}
          >
            <iframe
              ref={iframeRef}
              title="Thumbnail Preview"
              className="w-full h-full border-0"
              srcDoc={srcdoc}
              sandbox="allow-scripts"
            />
          </div>

          {/* Capture Area Overlay */}
          <div
            ref={captureAreaRef}
            className="absolute pointer-events-none"
            style={{
              width: captureSize.width,
              height: captureSize.height,
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Clear area in center */}
            <div className="w-full h-full border-2 border-[#5B50E8] border-dashed bg-transparent" />
            
            {/* Corner markers */}
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#5B50E8]" />
            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#5B50E8]" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#5B50E8]" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#5B50E8]" />
            
            {/* Size label */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#5B50E8] text-white text-xs rounded">
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
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-800 border-t border-gray-700 flex items-center justify-between">
          <span className="text-gray-400 text-sm">
            Position the component preview within the capture frame, then click Capture
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
              disabled={isCapturing}
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
