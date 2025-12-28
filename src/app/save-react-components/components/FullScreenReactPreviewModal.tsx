"use client";

import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  SandpackProvider,
  SandpackPreview,
  SandpackLayout,
} from "@codesandbox/sandpack-react";

interface FullScreenReactPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentCode: string;
  cssCode?: string;
  dependencies?: string[];
}

export default function FullScreenReactPreviewModal({
  isOpen,
  onClose,
  componentCode,
  cssCode = "",
  dependencies = [],
}: FullScreenReactPreviewModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  
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
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleKeyDown]);

  // Measure container height dynamically
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isOpen) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    // Initial measurement
    setContainerHeight(container.clientHeight);

    return () => resizeObserver.disconnect();
  }, [isOpen]);

  // Build dependency object for Sandpack
  const sandpackDependencies = useMemo(() => {
    const deps: Record<string, string> = {};
    
    for (const dep of dependencies) {
      deps[dep] = 'latest';
    }
    
    return deps;
  }, [dependencies]);

  // Base CSS for centering content in the preview
  const baseCss = `
body, html {
  margin: 0;
  padding: 0;
  min-height: 100%;
}
#root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
}
`.trim();

  // Prepare the component code - add React import and ensure export
  const preparedCode = useMemo(() => {
    let code = componentCode;
    
    // Add React import if not present (for React.useState, React.useEffect etc.)
    if (!code.includes('import React')) {
      code = `import React from 'react';\n${code}`;
    }
    
    if (!code.includes('export default')) {
      const constMatch = code.match(/const\s+([A-Z][a-zA-Z0-9]*)\s*=/);
      const funcMatch = code.match(/function\s+([A-Z][a-zA-Z0-9]*)\s*\(/);
      
      const componentName = constMatch?.[1] || funcMatch?.[1];
      
      if (componentName) {
        code = code + `\n\nexport default ${componentName};`;
      }
    }
    
    return code;
  }, [componentCode]);

  // Files for Sandpack - always include base CSS for centering
  const files = useMemo(() => {
    // Combine base CSS with any custom CSS
    const combinedCss = cssCode.trim() ? `${baseCss}\n\n${cssCode}` : baseCss;
    
    const fileMap: Record<string, { code: string; active?: boolean }> = {
      "/App.js": {
        code: preparedCode,
        active: true,
      },
      "/styles.css": {
        code: combinedCss,
      },
    };
    
    return fileMap;
  }, [preparedCode, cssCode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-[95vw] h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-emerald-600 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚛️</span>
            <span className="text-white font-semibold text-lg">React Preview</span>
            <span className="text-white/70 text-sm">(Full Screen)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors ml-4"
              title="Close (Esc)"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Sandpack Preview - dynamically sized */}
        <div 
          ref={containerRef}
          className="flex-1 min-h-0 overflow-hidden bg-white"
        >
          {containerHeight !== null && containerHeight > 0 && (
            <SandpackProvider
              template="react"
              files={files}
              customSetup={{
                dependencies: sandpackDependencies,
              }}
              options={{
                recompileMode: "delayed",
                recompileDelay: 1000,
                externalResources: ["https://cdn.tailwindcss.com"],
              }}
              theme="light"
            >
              <SandpackLayout style={{ height: containerHeight }}>
                <SandpackPreview
                  showOpenInCodeSandbox={false}
                  showRefreshButton={true}
                  style={{ height: containerHeight, width: "100%" }}
                />
              </SandpackLayout>
            </SandpackProvider>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-100 border-t border-gray-200 flex items-center justify-between shrink-0">
          <span className="text-gray-500 text-sm">
            Press <kbd className="px-2 py-0.5 bg-gray-200 rounded text-xs">Esc</kbd> to close
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
