/**
 * Supported React Dependencies for Sandbox Preview
 * 
 * These packages work in the browser sandbox using a combination of:
 * - UMD builds for packages that have them
 * - Dynamic imports with proper configuration for ESM packages
 */

export interface DependencyConfig {
  name: string;
  displayName: string;
  description: string;
  version: string;
  cdnUrl: string;
  globalVar: string;
  category: 'icons' | 'animation' | 'ui' | 'utility' | 'state' | 'styling';
  commonImports: string[];
}

export const SUPPORTED_DEPENDENCIES: DependencyConfig[] = [
  // Icons - lucide-react
  {
    name: 'lucide-react',
    displayName: 'Lucide React',
    description: 'Beautiful & consistent icons library',
    version: '0.263.1',
    cdnUrl: 'https://unpkg.com/lucide-react@0.263.1/dist/umd/lucide-react.js',
    globalVar: 'lucideReact',
    category: 'icons',
    commonImports: ['ArrowRight', 'Check', 'X', 'Menu', 'Search', 'Home', 'Settings', 'User', 'Star', 'Heart', 'ChevronLeft', 'ChevronRight', 'ChevronUp', 'ChevronDown'],
  },
  
  // Utility
  {
    name: 'clsx',
    displayName: 'clsx',
    description: 'Utility for constructing className strings',
    version: '2.0.0',
    cdnUrl: 'https://unpkg.com/clsx@2.0.0/dist/clsx.min.js',
    globalVar: 'clsx',
    category: 'utility',
    commonImports: ['clsx'],
  },
  
  // Styling
  {
    name: 'tailwindcss',
    displayName: 'Tailwind CSS (Play CDN)',
    description: 'Utility-first CSS framework',
    version: '3.4.0',
    cdnUrl: 'https://cdn.tailwindcss.com',
    globalVar: 'tailwind',
    category: 'styling',
    commonImports: [],
  },
];

/**
 * Get dependency config by name
 */
export function getDependencyByName(name: string): DependencyConfig | undefined {
  return SUPPORTED_DEPENDENCIES.find(dep => dep.name === name);
}

/**
 * Get dependencies by category
 */
export function getDependenciesByCategory(category: DependencyConfig['category']): DependencyConfig[] {
  return SUPPORTED_DEPENDENCIES.filter(dep => dep.category === category);
}

/**
 * Generate the sandbox HTML with dependencies
 * 
 * Strategy:
 * 1. Load React and ReactDOM from UMD builds (makes them globally available)
 * 2. Load dependencies from UMD builds as script tags
 * 3. Process user code to remove ES imports and use globals instead
 * 4. Use Babel standalone to transform JSX
 */
export function generateSandboxHtml(
  componentCode: string,
  cssCode: string,
  dependencies: string[] = []
): string {
  const deps = dependencies.map(name => getDependencyByName(name)).filter(Boolean) as DependencyConfig[];
  
  // Separate Tailwind from other dependencies
  const hasTailwind = deps.some(d => d.name === 'tailwindcss');
  const umdDeps = deps.filter(d => d.name !== 'tailwindcss');
  
  // Generate script tags for UMD dependencies
  const depScriptTags = umdDeps.map(d => 
    `<script src="${d.cdnUrl}"></script>`
  ).join('\n  ');
  
  // Process the user's component code
  let processedCode = componentCode;
  
  // Remove all import statements for supported packages and React
  const importPatterns = [
    // import { X, Y } from 'package'
    /import\s*\{[^}]*\}\s*from\s*['"][^'"]+['"];?\n?/g,
    // import X from 'package'
    /import\s+\w+\s+from\s*['"][^'"]+['"];?\n?/g,
    // import * as X from 'package'
    /import\s*\*\s*as\s+\w+\s+from\s*['"][^'"]+['"];?\n?/g,
    // import 'package'
    /import\s*['"][^'"]+['"];?\n?/g,
  ];
  
  for (const pattern of importPatterns) {
    processedCode = processedCode.replace(pattern, '');
  }
  
  // Clean up whitespace
  processedCode = processedCode.trim();
  
  // Generate global destructuring for dependencies
  const globalSetup = umdDeps.map(d => {
    if (d.name === 'lucide-react') {
      // lucide-react exposes icons on window.lucideReact
      return `
      // Destructure all lucide icons from global
      const { ${d.commonImports.join(', ')} } = window.lucideReact || {};`;
    } else if (d.name === 'clsx') {
      return `
      // clsx is available as window.clsx
      const clsx = window.clsx;`;
    }
    return '';
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  ${hasTailwind ? '<script src="https://cdn.tailwindcss.com"></script>' : ''}
  ${depScriptTags}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      padding: 16px;
      background: #ffffff;
    }
    .error-container {
      background: #fee2e2;
      border: 1px solid #ef4444;
      border-radius: 8px;
      padding: 16px;
      color: #dc2626;
      font-family: monospace;
      font-size: 13px;
      white-space: pre-wrap;
    }
    .error-title { font-weight: bold; margin-bottom: 8px; }
    ${cssCode}
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react">
    // React hooks available globally
    const { useState, useEffect, useRef, useCallback, useMemo, useContext, useReducer } = React;
    ${globalSetup}
    
    try {
      ${processedCode}
      
      const root = ReactDOM.createRoot(document.getElementById('root'));
      
      // Try to render known component names
      if (typeof App !== 'undefined') {
        root.render(<App />);
      } else if (typeof Calendar !== 'undefined') {
        root.render(<Calendar />);
      } else if (typeof Component !== 'undefined') {
        root.render(<Component />);
      } else if (typeof Default !== 'undefined') {
        root.render(<Default />);
      } else {
        // Try to find any exported component
        const code = ${JSON.stringify(processedCode)};
        const match = code.match(/(?:const|function|class)\\s+([A-Z][a-zA-Z0-9]*)\\s*[=({]/);
        if (match) {
          const componentName = match[1];
          if (typeof window[componentName] !== 'undefined') {
            root.render(React.createElement(window[componentName]));
          } else {
            // The component might be in local scope, try eval
            try {
              const comp = eval(componentName);
              root.render(React.createElement(comp));
            } catch {
              throw new Error('Component "' + componentName + '" found but not accessible');
            }
          }
        } else {
          throw new Error('No React component found. Define a component like: const App = () => <div>Hello</div>');
        }
      }
    } catch (error) {
      console.error('Sandbox Error:', error);
      document.getElementById('root').innerHTML = 
        '<div class="error-container"><div class="error-title">⚠️ Error</div>' + error.message + '</div>';
    }
  </script>
</body>
</html>`;
}

/**
 * Detect dependencies from code
 * Looks for import statements and returns matching supported dependencies
 */
export function detectDependenciesFromCode(code: string): string[] {
  const detected: string[] = [];
  
  // Look for import statements
  const importRegex = /import\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(code)) !== null) {
    const importPath = match[1];
    const dep = SUPPORTED_DEPENDENCIES.find(d => 
      importPath === d.name || importPath.startsWith(d.name + '/')
    );
    if (dep && !detected.includes(dep.name)) {
      detected.push(dep.name);
    }
  }
  
  // Also check for common usage patterns  
  for (const dep of SUPPORTED_DEPENDENCIES) {
    if (detected.includes(dep.name)) continue;
    
    for (const commonImport of dep.commonImports) {
      if (code.includes(commonImport)) {
        const regex = new RegExp(`<${commonImport}[\\s/>]|\\b${commonImport}\\s*\\(`, 'g');
        if (regex.test(code)) {
          detected.push(dep.name);
          break;
        }
      }
    }
  }
  
  return detected;
}
