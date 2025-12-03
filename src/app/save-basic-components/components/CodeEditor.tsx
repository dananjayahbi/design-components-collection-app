"use client";

import Editor from "@monaco-editor/react";

interface CodeEditorProps {
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

export default function CodeEditor({
  language,
  value,
  onChange,
  label,
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
      <div className={`${config.label} px-3 py-2 flex items-center gap-2`}>
        <span className="text-lg">{config.icon}</span>
        <span className="text-white font-semibold text-sm">{label}</span>
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
