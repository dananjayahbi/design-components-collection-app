"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import CodeEditor from "./CodeEditor";
import SandboxPreview from "./SandboxPreview";
import SaveComponentModal from "./SaveComponentModal";
import { Copy, Check, RotateCcw, Trash2, Save, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

// Sample starter code
const defaultHtml = `<div class="card">
  <h2>Hello World!</h2>
  <p>This is a basic component sandbox.</p>
  <button id="myButton">Click Me</button>
</div>`;

const defaultCss = `.card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px;
  border-radius: 12px;
  color: white;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.card h2 {
  margin-bottom: 12px;
  font-size: 24px;
}

.card p {
  margin-bottom: 16px;
  opacity: 0.9;
}

.card button {
  background: white;
  color: #764ba2;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.card button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}`;

const defaultJs = `const button = document.getElementById('myButton');
let count = 0;

button.addEventListener('click', () => {
  count++;
  button.textContent = \`Clicked \${count} times!\`;
});`;

interface EditingComponent {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
}

export default function BasicComponentsContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [html, setHtml] = useState(defaultHtml);
  const [css, setCss] = useState(defaultCss);
  const [javascript, setJavascript] = useState(defaultJs);
  const [copied, setCopied] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingComponent, setEditingComponent] =
    useState<EditingComponent | null>(null);

  // Load component from localStorage when editing
  useEffect(() => {
    if (editId) {
      // First try the new localStorage key format (with component ID)
      let storedComponent = localStorage.getItem(`editComponent_${editId}`);
      
      // Fallback to old sessionStorage method for backward compatibility
      if (!storedComponent) {
        storedComponent = sessionStorage.getItem("editComponent");
      }
      
      if (storedComponent) {
        try {
          const component = JSON.parse(storedComponent);
          if (component.id === editId) {
            setHtml(component.html || "");
            setCss(component.css || "");
            setJavascript(component.javascript || "");
            setEditingComponent({
              id: component.id,
              name: component.name,
              description: component.description,
              tags: component.tags || [],
            });
            // Clear storage after loading
            localStorage.removeItem(`editComponent_${editId}`);
            sessionStorage.removeItem("editComponent");
          }
        } catch (e) {
          console.error("Failed to parse edit component:", e);
        }
      }
    }
  }, [editId]);

  const handleClearAll = () => {
    setHtml("");
    setCss("");
    setJavascript("");
  };

  const handleResetDefaults = () => {
    setHtml(defaultHtml);
    setCss(defaultCss);
    setJavascript(defaultJs);
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
    const fullCode = `<!-- HTML -->\n${html}\n\n/* CSS */\n<style>\n${css}\n</style>\n\n// JavaScript\n<script>\n${javascript}\n</script>`;
    await copyToClipboard(fullCode, "all");
  }, [html, css, javascript, copyToClipboard]);

  const handleSaveComponent = async (
    name: string,
    description: string,
    tags: string[]
  ) => {
    setIsSaving(true);
    try {
      const isUpdating = !!editingComponent;
      const url = "/api/basic-components";
      const method = isUpdating ? "PATCH" : "POST";

      const body = isUpdating
        ? {
            id: editingComponent.id,
            name,
            description,
            html,
            css,
            javascript,
            tags,
          }
        : {
            name,
            description,
            html,
            css,
            javascript,
            tags,
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

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col">
      {/* Header with actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {editingComponent && (
            <Link
              href="/basic-components"
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
                : "Save Basic Components"}
            </h1>
            <p className="text-gray-600 text-sm">
              {editingComponent
                ? "Edit your component code and save changes."
                : "Write HTML, CSS, and JavaScript code to preview and save your components."}
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
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            {editingComponent ? "Update" : "Save"}
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left side - Code editors */}
        <div className="w-1/2 flex flex-col gap-3">
          <div className="flex-1 min-h-0">
            <CodeEditor
              language="html"
              value={html}
              onChange={setHtml}
              label="HTML"
            />
          </div>
          <div className="flex-1 min-h-0">
            <CodeEditor
              language="css"
              value={css}
              onChange={setCss}
              label="CSS"
            />
          </div>
          <div className="flex-1 min-h-0">
            <CodeEditor
              language="javascript"
              value={javascript}
              onChange={setJavascript}
              label="JavaScript"
            />
          </div>
        </div>

        {/* Right side - Preview */}
        <div className="w-1/2">
          <SandboxPreview html={html} css={css} javascript={javascript} />
        </div>
      </div>

      {/* Save Component Modal */}
      <SaveComponentModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveComponent}
        isSaving={isSaving}
        initialName={editingComponent?.name || ""}
        initialDescription={editingComponent?.description || ""}
        initialTags={editingComponent?.tags || []}
        isEditing={!!editingComponent}
      />
    </div>
  );
}
