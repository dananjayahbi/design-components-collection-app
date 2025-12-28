"use client";

import Editor from "@monaco-editor/react";
import { Maximize2 } from "lucide-react";

interface ReactCodeEditorProps {
  language: "javascript" | "typescript" | "css";
  value: string;
  onChange: (value: string) => void;
  label: string;
  onExpand?: () => void;
}

const languageConfig = {
  javascript: {
    border: "border-blue-400",
    label: "bg-blue-600",
    icon: "⚛️",
    monacoLang: "javascript",
  },
  typescript: {
    border: "border-blue-500",
    label: "bg-blue-700",
    icon: "⚛️",
    monacoLang: "typescript",
  },
  css: {
    border: "border-pink-400",
    label: "bg-pink-500",
    icon: "🎨",
    monacoLang: "css",
  },
};

export default function ReactCodeEditor({
  language,
  value,
  onChange,
  label,
  onExpand,
}: ReactCodeEditorProps) {
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
