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
  
  // Always include Tailwind for React components as it's very commonly used
  // Check if Tailwind classes are present in the code
  const tailwindPatterns = /\b(bg-|text-|flex|grid|p-|m-|w-|h-|rounded|border|shadow|hover:|focus:|sm:|md:|lg:|xl:|dark:)/;
  const hasTailwindClasses = tailwindPatterns.test(componentCode);
  const hasTailwind = deps.some(d => d.name === 'tailwindcss') || hasTailwindClasses;
  const umdDeps = deps.filter(d => d.name !== 'tailwindcss');
  
  // Generate script tags for UMD dependencies
  const depScriptTags = umdDeps.map(d => 
    `<script src="${d.cdnUrl}"></script>`
  ).join('\n  ');
  
  // Process the user's component code
  let processedCode = componentCode;
  
  // Remove all import statements for supported packages and React
  const importPatterns = [
    // import React, { X, Y } from 'package' (default + named imports)
    /import\s+\w+\s*,\s*\{[^}]*\}\s*from\s*['"][^'"]+['"];?\n?/g,
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
  
  // Remove export default statements (they're not valid in non-module scripts)
  // e.g., "export default ComponentName;" or "export default function ComponentName"
  processedCode = processedCode.replace(/export\s+default\s+([A-Z][a-zA-Z0-9]*)\s*;?/g, '');
  processedCode = processedCode.replace(/export\s+default\s+function\s+/g, 'function ');
  processedCode = processedCode.replace(/export\s+default\s+class\s+/g, 'class ');
  processedCode = processedCode.replace(/export\s+default\s+const\s+/g, 'const ');
  
  // Clean up whitespace
  processedCode = processedCode.trim();
  
  // Generate global destructuring for dependencies
  const globalSetup = umdDeps.map(d => {
    if (d.name === 'lucide-react') {
      // Extract all icons being imported from the original code
      const iconImportMatch = componentCode.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/);
      let destructureStatements: string[] = [];
      let iconNames: string[] = [...d.commonImports];
      
      if (iconImportMatch) {
        // Parse the import statement to get icon names and aliases
        const imports = iconImportMatch[1].split(',').map(s => s.trim()).filter(s => s.length > 0);
        
        for (const imp of imports) {
          // Handle "Icon as Alias" pattern
          const asMatch = imp.match(/^([A-Z][a-zA-Z0-9]*)\s+as\s+([A-Za-z][a-zA-Z0-9]*)$/);
          if (asMatch) {
            const [, originalName, aliasName] = asMatch;
            iconNames.push(originalName);
            // Create both the original and the alias - LucideReact uses capital L
            destructureStatements.push(`const ${aliasName} = window.LucideReact?.${originalName};`);
          } else if (/^[A-Z]/.test(imp)) {
            iconNames.push(imp);
          }
        }
      }
      
      // Remove duplicates
      iconNames = [...new Set(iconNames)];
      
      // lucide-react UMD exposes icons on window.LucideReact (capital L)
      return `
      // Destructure lucide icons from global (LucideReact with capital L)
      const { ${iconNames.join(', ')} } = window.LucideReact || {};
      ${destructureStatements.join('\n      ')}`;
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
  <script>
    // Shim for lucide-react UMD which expects window.react (lowercase)
    window.react = window.React;
  </script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  ${hasTailwind ? '<script src="https://cdn.tailwindcss.com"></script>' : ''}
  ${depScriptTags}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #ffffff;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 16px;
    }
    #root {
      display: flex;
      justify-content: center;
      align-items: center;
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
      
      // Try to render known component names first
      if (typeof App !== 'undefined') {
        root.render(<App />);
      } else if (typeof AnalogClockPicker !== 'undefined') {
        root.render(<AnalogClockPicker />);
      } else if (typeof Calendar !== 'undefined') {
        root.render(<Calendar />);
      } else if (typeof Component !== 'undefined') {
        root.render(<Component />);
      } else if (typeof Default !== 'undefined') {
        root.render(<Default />);
      } else if (typeof Card !== 'undefined') {
        root.render(<Card />);
      } else if (typeof Button !== 'undefined') {
        root.render(<Button />);
      } else if (typeof Modal !== 'undefined') {
        root.render(<Modal />);
      } else if (typeof Form !== 'undefined') {
        root.render(<Form />);
      } else {
        // Try to find any component from the code by regex
        const code = ${JSON.stringify(processedCode)};
        
        // Match const ComponentName = or function ComponentName or export default function ComponentName
        const constMatch = code.match(/const\\s+([A-Z][a-zA-Z0-9]*)\\s*=/);
        const funcMatch = code.match(/function\\s+([A-Z][a-zA-Z0-9]*)\\s*\\(/);
        const exportMatch = code.match(/export\\s+default\\s+(?:function\\s+)?([A-Z][a-zA-Z0-9]*)/);
        
        const componentName = exportMatch?.[1] || constMatch?.[1] || funcMatch?.[1];
        
        if (componentName) {
          try {
            // Try to evaluate the component name to get the function reference
            const comp = eval(componentName);
            if (typeof comp === 'function') {
              root.render(React.createElement(comp));
            } else {
              throw new Error('Component "' + componentName + '" is not a valid React component');
            }
          } catch (evalError) {
            throw new Error('Component "' + componentName + '" found but not accessible: ' + evalError.message);
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
  
  // Detect Tailwind CSS usage by looking for common Tailwind class patterns
  // Common Tailwind patterns: bg-, text-, flex, grid, p-, m-, w-, h-, rounded, border, shadow, etc.
  const tailwindPatterns = [
    /className=["'][^"']*\b(bg-|text-|flex|grid|p-|m-|w-|h-|rounded|border|shadow|hover:|focus:|sm:|md:|lg:|xl:|dark:)/,
    /className={[^}]*\b(bg-|text-|flex|grid|p-|m-|w-|h-|rounded|border|shadow)/,
  ];
  
  if (!detected.includes('tailwindcss')) {
    for (const pattern of tailwindPatterns) {
      if (pattern.test(code)) {
        detected.push('tailwindcss');
        break;
      }
    }
  }
  
  return detected;
}
