"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ReactCodeEditor from "./ReactCodeEditor";
import ReactSandboxPreview from "./ReactSandboxPreview";
import SaveReactComponentModal from "./SaveReactComponentModal";
import FullScreenReactEditorModal from "./FullScreenReactEditorModal";
import FullScreenReactPreviewModal from "./FullScreenReactPreviewModal";
import ReactThumbnailCaptureModal from "./ReactThumbnailCaptureModal";
import DependencySelector from "./DependencySelector";
import { Copy, Check, RotateCcw, Trash2, Save, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { detectDependenciesFromCode } from "@/lib/constants/reactDependencies";

// Sample starter React component code with Tailwind CSS
const defaultComponentCode = `function App() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-xl text-white text-center shadow-lg max-w-sm">
      <h2 className="text-2xl font-bold mb-3">Hello React! ⚛️</h2>
      <p className="mb-3 opacity-90">This is a React component sandbox.</p>
      <p className="mb-4 opacity-90">Count: {count}</p>
      <button 
        onClick={() => setCount(count + 1)}
        className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
      >
        Click Me
      </button>
    </div>
  );
}`;

// Empty CSS by default since we use Tailwind
const defaultCssCode = ``;

interface EditingComponent {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  dependencies?: string[];
}

export default function ReactComponentsContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [componentCode, setComponentCode] = useState(defaultComponentCode);
  const [cssCode, setCssCode] = useState(defaultCssCode);
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [dependenciesReady, setDependenciesReady] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingComponent, setEditingComponent] =
    useState<EditingComponent | null>(null);
  
  // Full screen modal states
  const [fullScreenEditor, setFullScreenEditor] = useState<{
    isOpen: boolean;
    language: "javascript" | "css";
    label: string;
  }>({ isOpen: false, language: "javascript", label: "React Component" });
  const [showFullScreenPreview, setShowFullScreenPreview] = useState(false);
  const [isLoadingComponent, setIsLoadingComponent] = useState(false);
  
  // Thumbnail capture modal state
  const [showThumbnailCapture, setShowThumbnailCapture] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<{
    name: string;
    description: string;
    tags: string[];
  } | null>(null);

  // Auto-detect dependencies from import statements
  useEffect(() => {
    const detectedPackages = detectDependenciesFromCode(componentCode);
    
    // Merge detected packages with existing dependencies (don't remove manually added ones)
    setDependencies(prev => {
      const combined = new Set([...prev, ...detectedPackages]);
      const newDeps = Array.from(combined);
      
      // Only update if there are changes
      if (newDeps.length !== prev.length || !newDeps.every(d => prev.includes(d))) {
        return newDeps;
      }
      return prev;
    });
    
    // Mark dependencies as ready after detection runs
    // Use setTimeout to ensure the state update has been processed
    setTimeout(() => {
      setDependenciesReady(true);
    }, 0);
  }, [componentCode]);

  // Load component from localStorage when editing, or fetch from API on refresh
  useEffect(() => {
    if (editId) {
      // First try the new localStorage key format (with component ID)
      let storedComponent = localStorage.getItem(`editReactComponent_${editId}`);
      
      // Fallback to old sessionStorage method for backward compatibility
      if (!storedComponent) {
        storedComponent = sessionStorage.getItem("editReactComponent");
      }
      
      if (storedComponent) {
        try {
          const component = JSON.parse(storedComponent);
          if (component.id === editId) {
            setComponentCode(component.componentCode || "");
            setCssCode(component.cssCode || "");
            setDependencies(component.dependencies || []);
            setEditingComponent({
              id: component.id,
              name: component.name,
              description: component.description,
              tags: component.tags || [],
              dependencies: component.dependencies || [],
            });
            // Clear storage after loading
            localStorage.removeItem(`editReactComponent_${editId}`);
            sessionStorage.removeItem("editReactComponent");
            return;
          }
        } catch (e) {
          console.error("Failed to parse edit component:", e);
        }
      }
      
      // If no stored component, fetch from API (handles page refresh scenario)
      const fetchComponent = async () => {
        setIsLoadingComponent(true);
        try {
          const response = await fetch(`/api/react-components?id=${editId}`);
          if (response.ok) {
            const component = await response.json();
            setComponentCode(component.componentCode || "");
            setCssCode(component.cssCode || "");
            setDependencies(component.dependencies || []);
            setEditingComponent({
              id: component.id,
              name: component.name,
              description: component.description,
              tags: component.tags || [],
              dependencies: component.dependencies || [],
            });
          } else {
            console.error("Failed to fetch component");
            toast.error("Failed to load component");
          }
        } catch (error) {
          console.error("Error fetching component:", error);
          toast.error("Error loading component");
        } finally {
          setIsLoadingComponent(false);
        }
      };
      
      fetchComponent();
    }
  }, [editId]);

  const handleClearAll = () => {
    setComponentCode("");
    setCssCode("");
  };

  const handleResetDefaults = () => {
    setComponentCode(defaultComponentCode);
    setCssCode(defaultCssCode);
  };

  const copyToClipboard = useCallback(async (code: string, type: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, []);

  const copyAllCode = useCallback(async () => {
    const fullCode = `// React Component\n${componentCode}\n\n/* CSS */\n${cssCode}`;
    await copyToClipboard(fullCode, "all");
  }, [componentCode, cssCode, copyToClipboard]);

  const handleSaveComponent = async (
    name: string,
    description: string,
    tags: string[],
    thumbnailUrl?: string
  ) => {
    setIsSaving(true);
    try {
      const isUpdating = !!editingComponent;
      const url = "/api/react-components";
      const method = isUpdating ? "PATCH" : "POST";

      const body = isUpdating
        ? {
            id: editingComponent.id,
            name,
            description,
            componentCode,
            cssCode,
            dependencies,
            tags,
            ...(thumbnailUrl && { thumbnailUrl }),
          }
        : {
            name,
            description,
            componentCode,
            cssCode,
            dependencies,
            tags,
            ...(thumbnailUrl && { thumbnailUrl }),
          };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save component");
      }

      toast.success(
        isUpdating
          ? "Component updated successfully!"
          : "Component saved successfully!"
      );
      setShowSaveModal(false);

      // If updating, update the editingComponent with new values
      if (isUpdating) {
        setEditingComponent({
          ...editingComponent,
          name,
          description,
          tags,
          dependencies,
        });
      }
    } catch (error) {
      console.error("Error saving component:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save component"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle initiating thumbnail capture flow
  const handleCaptureThumbail = (name: string, description: string, tags: string[]) => {
    setPendingSaveData({ name, description, tags });
    setShowSaveModal(false);
    setShowThumbnailCapture(true);
  };

  // Handle thumbnail capture completion
  const handleThumbnailCaptured = async (thumbnailBlob: Blob) => {
    if (!pendingSaveData) return;

    setIsSaving(true);
    try {
      // Upload the thumbnail first
      const formData = new FormData();
      formData.append("thumbnail", thumbnailBlob, "thumbnail.png");
      formData.append("type", "react"); // Specify it's a react component thumbnail

      const uploadResponse = await fetch("/api/thumbnails", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload thumbnail");
      }

      const { thumbnailUrl } = await uploadResponse.json();

      // Close thumbnail capture modal
      setShowThumbnailCapture(false);

      // Now save the component with the thumbnail URL
      await handleSaveComponent(
        pendingSaveData.name,
        pendingSaveData.description,
        pendingSaveData.tags,
        thumbnailUrl
      );

      setPendingSaveData(null);
    } catch (error) {
      console.error("Error capturing thumbnail:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to capture thumbnail"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col">
      {/* Header with actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {editingComponent && (
            <Link
              href="/react-components"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to components"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {editingComponent
                ? `Editing: ${editingComponent.name}`
                : "Save React Components"}
            </h1>
            <p className="text-gray-600 text-sm">
              {editingComponent
                ? "Edit your React component code and save changes."
                : "Write React component code with CSS to preview and save your components."}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => copyAllCode()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {copied === "all" ? (
              <>
                <Check className="w-4 h-4 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy All
              </>
            )}
          </button>
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            {editingComponent ? "Update" : "Save"}
          </button>
        </div>
      </div>

      {/* Main content area - Different layout for React (horizontal split with two editors on left) */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left side - Code editors and dependencies (stacked) */}
        <div className="w-1/2 flex flex-col gap-3">
          {/* Dependency Selector */}
          <DependencySelector
            selectedDependencies={dependencies}
            onDependenciesChange={setDependencies}
            componentCode={componentCode}
          />
          {/* React Component Editor - Takes full space */}
          <div className="flex-1 min-h-0">
            <ReactCodeEditor
              language="javascript"
              value={componentCode}
              onChange={setComponentCode}
              label="React Component (JSX + Tailwind CSS)"
              onExpand={() => setFullScreenEditor({ isOpen: true, language: "javascript", label: "React Component (JSX + Tailwind CSS)" })}
            />
          </div>
        </div>

        {/* Right side - Preview */}
        <div className="w-1/2">
          {dependenciesReady ? (
            <ReactSandboxPreview 
              componentCode={componentCode} 
              cssCode={cssCode}
              dependencies={dependencies}
              onExpand={() => setShowFullScreenPreview(true)}
            />
          ) : (
            <div className="h-full w-full rounded-lg border-2 border-emerald-400 overflow-hidden bg-white flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm">Initializing preview...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Component Modal */}
      <SaveReactComponentModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={(name, description, tags) => handleSaveComponent(name, description, tags)}
        onCaptureThumbail={handleCaptureThumbail}
        isSaving={isSaving}
        initialName={editingComponent?.name || ""}
        initialDescription={editingComponent?.description || ""}
        initialTags={editingComponent?.tags || []}
        isEditing={!!editingComponent}
      />

      {/* Thumbnail Capture Modal */}
      <ReactThumbnailCaptureModal
        isOpen={showThumbnailCapture}
        onClose={() => {
          setShowThumbnailCapture(false);
          setPendingSaveData(null);
        }}
        onCapture={handleThumbnailCaptured}
        componentCode={componentCode}
        cssCode={cssCode}
        dependencies={dependencies}
        componentName={pendingSaveData?.name || "Component"}
      />

      {/* Full Screen Editor Modal */}
      <FullScreenReactEditorModal
        isOpen={fullScreenEditor.isOpen}
        onClose={() => setFullScreenEditor({ ...fullScreenEditor, isOpen: false })}
        language={fullScreenEditor.language}
        label={fullScreenEditor.label}
        value={
          fullScreenEditor.language === "javascript" 
            ? componentCode 
            : cssCode
        }
        onChange={(value) => {
          if (fullScreenEditor.language === "javascript") setComponentCode(value);
          else setCssCode(value);
        }}
      />

      {/* Full Screen Preview Modal */}
      <FullScreenReactPreviewModal
        isOpen={showFullScreenPreview}
        onClose={() => setShowFullScreenPreview(false)}
        componentCode={componentCode}
        cssCode={cssCode}
        dependencies={dependencies}
      />
    </div>
  );
}
