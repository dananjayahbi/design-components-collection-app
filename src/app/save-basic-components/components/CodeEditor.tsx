"use client";

import Editor from "@monaco-editor/react";
import { Maximize2 } from "lucide-react";

interface CodeEditorProps {
  language: "html" | "css" | "javascript";
  value: string;
  onChange: (value: string) => void;
  label: string;
  onExpand?: () => void;
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

export default function CodeEditor({
  language,
  value,
  onChange,
  label,
  onExpand,
}: CodeEditorProps) {
  const config = languageConfig[language];

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || "");
  };

  return (
    <div
      className={`flex flex-col h-full rounded-lg border-2 ${config.border} overflow-hidden`}
    >
      {/* Header */}
      <div className={`${config.label} px-3 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <span className="text-white font-semibold text-sm">{label}</span>
        </div>
        {onExpand && (
          <button
            onClick={onExpand}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            title="Open in Full Screen"
          >
            <Maximize2 className="w-4 h-4 text-white" />
          </button>
        )}
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
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            wrappingIndent: "indent",
            automaticLayout: true,
            tabSize: 2,
            padding: { top: 8, bottom: 8 },
            scrollbar: {
              vertical: "auto",
              horizontal: "auto",
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
        />
      </div>
    </div>
  );
}
