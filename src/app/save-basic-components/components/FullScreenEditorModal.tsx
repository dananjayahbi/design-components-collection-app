"use client";

import { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import Editor from "@monaco-editor/react";

interface FullScreenEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: "html" | "css" | "javascript";
  value: string;
  onChange: (value: string) => void;
  label: string;
}

const languageConfig = {
  html: {
    border: "border-orange-400",
    label: "bg-orange-500",
    icon: "📄",
    monacoLang: "html",
  },
  css: {
    border: "border-blue-400",
    label: "bg-blue-500",
    icon: "🎨",
    monacoLang: "css",
  },
  javascript: {
    border: "border-yellow-400",
    label: "bg-yellow-500",
    icon: "⚡",
    monacoLang: "javascript",
  },
};

export default function FullScreenEditorModal({
  isOpen,
  onClose,
  language,
  value,
  onChange,
  label,
}: FullScreenEditorModalProps) {
  const config = languageConfig[language];

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

  if (!isOpen) return null;

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || "");
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-[95vw] h-[90vh] bg-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`${config.label} px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <span className="text-xl">{config.icon}</span>
            <span className="text-white font-semibold text-lg">{label}</span>
            <span className="text-white/70 text-sm">(Full Screen Editor)</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            language={config.monacoLang}
            value={value}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              wordWrap: "on",
              wrappingIndent: "indent",
              automaticLayout: true,
              tabSize: 2,
              padding: { top: 12, bottom: 12 },
              scrollbar: {
                vertical: "auto",
                horizontal: "auto",
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10,
              },
            }}
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-800 border-t border-gray-700 flex items-center justify-between">
          <span className="text-gray-400 text-sm">
            Press <kbd className="px-2 py-0.5 bg-gray-700 rounded text-xs">Esc</kbd> to close
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#5B50E8] text-white rounded-lg hover:bg-[#4a41c7] transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
