"use client";

import { useState, useEffect } from "react";

interface CodeEditorProps {
  language: "html" | "css" | "javascript";
  value: string;
  onChange: (value: string) => void;
  label: string;
}

const languageColors = {
  html: {
    border: "border-orange-400",
    bg: "bg-orange-50",
    label: "bg-orange-500",
    icon: "📄",
  },
  css: {
    border: "border-blue-400",
    bg: "bg-blue-50",
    label: "bg-blue-500",
    icon: "🎨",
  },
  javascript: {
    border: "border-yellow-400",
    bg: "bg-yellow-50",
    label: "bg-yellow-500",
    icon: "⚡",
  },
};

export default function CodeEditor({
  language,
  value,
  onChange,
  label,
}: CodeEditorProps) {
  const colors = languageColors[language];

  return (
    <div className={`flex flex-col h-full rounded-lg border-2 ${colors.border} overflow-hidden`}>
      {/* Header */}
      <div className={`${colors.label} px-3 py-2 flex items-center gap-2`}>
        <span className="text-lg">{colors.icon}</span>
        <span className="text-white font-semibold text-sm">{label}</span>
      </div>

      {/* Editor */}
      <div className={`flex-1 ${colors.bg}`}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-full p-3 font-mono text-sm bg-transparent resize-none focus:outline-none`}
          placeholder={`Enter your ${language.toUpperCase()} code here...`}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
