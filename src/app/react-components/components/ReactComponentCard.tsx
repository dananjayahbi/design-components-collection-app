"use client";

import { useState, useRef, useEffect } from "react";
import { Edit, Trash2, ExternalLink, Code } from "lucide-react";
import type { ReactComponent } from "../hooks";
import {
  SandpackProvider,
  SandpackPreview,
  SandpackLayout,
} from "@codesandbox/sandpack-react";

interface ReactComponentCardProps {
  component: ReactComponent;
  onEdit: (component: ReactComponent) => void;
  onDelete: (id: string, name: string) => void;
}

export default function ReactComponentCard({
  component,
  onEdit,
  onDelete,
}: ReactComponentCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [imageError, setImageError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);

  // Measure container height dynamically when showing preview
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !showPreview) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    // Initial measurement
    setContainerHeight(container.clientHeight);

    return () => resizeObserver.disconnect();
  }, [showPreview]);

  // Build dependency object for Sandpack
  const sandpackDependencies: Record<string, string> = {};
  for (const dep of (component.dependencies || [])) {
    sandpackDependencies[dep] = 'latest';
  }

  // Base CSS to center components in preview
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
  let preparedCode = component.componentCode;
  
  // Add React import if not present (for React.useState, React.useEffect etc.)
  if (!preparedCode.includes('import React')) {
    preparedCode = `import React from 'react';\n${preparedCode}`;
  }
  
  if (!preparedCode.includes('export default')) {
    const constMatch = preparedCode.match(/const\s+([A-Z][a-zA-Z0-9]*)\s*=/);
    const funcMatch = preparedCode.match(/function\s+([A-Z][a-zA-Z0-9]*)\s*\(/);
    const componentName = constMatch?.[1] || funcMatch?.[1];
    if (componentName) {
      preparedCode = preparedCode + `\n\nexport default ${componentName};`;
    }
  }

  // Files for Sandpack - always include base CSS for centering
  const combinedCss = component.cssCode?.trim() 
    ? `${baseCss}\n\n${component.cssCode}` 
    : baseCss;
    
  const files: Record<string, { code: string; active?: boolean }> = {
    "/App.js": {
      code: preparedCode,
      active: true,
    },
    "/styles.css": {
      code: combinedCss,
    },
  };

  const formattedDate = new Date(component.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Preview Area */}
      <div ref={containerRef} className="relative aspect-video bg-gray-50 overflow-hidden">
        {showPreview && containerHeight !== null && containerHeight > 0 ? (
          // Live React Preview with Sandpack
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
                showRefreshButton={false}
                style={{ height: containerHeight, width: "100%" }}
              />
            </SandpackLayout>
          </SandpackProvider>
        ) : showPreview ? (
          // Loading state while measuring
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400">Loading...</span>
          </div>
        ) : component.thumbnailUrl && !imageError ? (
          // Thumbnail Image
          <img
            src={component.thumbnailUrl}
            alt={component.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          // Placeholder with React icon
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-50 to-purple-50">
            <div className="text-center">
              <span className="text-4xl">⚛️</span>
              <p className="text-gray-400 text-sm mt-2">React Component</p>
            </div>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
            title={showPreview ? "Hide Preview" : "Show Live Preview"}
          >
            <Code className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={() => onEdit(component)}
            className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
            title="Edit Component"
          >
            <Edit className="w-5 h-5 text-blue-600" />
          </button>
          <button
            onClick={() => onDelete(component.id, component.name)}
            className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
            title="Delete Component"
          >
            <Trash2 className="w-5 h-5 text-red-600" />
          </button>
        </div>

        {/* React badge */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
          ⚛️ React
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate" title={component.name}>
          {component.name}
        </h3>
        
        {component.description && (
          <p className="text-gray-600 text-sm mt-1 line-clamp-2">
            {component.description}
          </p>
        )}

        {/* Tags */}
        {component.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {component.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {component.tags.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                +{component.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">{formattedDate}</span>
          <button
            onClick={() => onEdit(component)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            Open <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
