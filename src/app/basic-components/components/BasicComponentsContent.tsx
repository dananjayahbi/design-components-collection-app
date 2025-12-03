"use client";

import { useState } from "react";
import CodeEditor from "./CodeEditor";
import SandboxPreview from "./SandboxPreview";

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

export default function BasicComponentsContent() {
  const [html, setHtml] = useState(defaultHtml);
  const [css, setCss] = useState(defaultCss);
  const [javascript, setJavascript] = useState(defaultJs);

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

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col">
      {/* Header with actions */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Component Sandbox</h1>
          <p className="text-gray-600 text-sm">
            Write HTML, CSS, and JavaScript code to preview your components in real-time.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleClearAll}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleResetDefaults}
            className="px-4 py-2 text-sm font-medium text-white bg-[#5B50E8] rounded-lg hover:bg-[#4840C7] transition-colors"
          >
            Reset Defaults
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
    </div>
  );
}
