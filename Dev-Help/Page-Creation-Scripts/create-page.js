#!/usr/bin/env node

/**
 * Automated Page Creation Script
 * 
 * This script automates the entire process of creating a new page in the dashboard,
 * including all necessary file updates, schema changes, and database migrations.
 * 
 * Usage: node create-page.js
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

// Helper to convert string to PascalCase
function toPascalCase(str) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

// Helper to convert string to camelCase
function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

// Helper to convert string to show{Page} format
function toShowFormat(str) {
  return 'show' + toPascalCase(str);
}

// Get project root
const projectRoot = path.resolve(__dirname, '../..');

console.log(`${colors.cyan}
╔════════════════════════════════════════════════════════════╗
║       🚀 Automated Page Creation Script                   ║
║       Dashboard Page Generator with Full Integration      ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`);

async function main() {
  try {
    // Step 1: Get user inputs
    console.log(`\n${colors.blue}📝 Step 1: Collecting Page Information${colors.reset}`);
    
    const pageFolderName = await question(`\n${colors.cyan}Enter page folder name (e.g., "my-new-page"): ${colors.reset}`);
    if (!pageFolderName || !/^[a-z][a-z0-9-]*$/.test(pageFolderName)) {
      throw new Error('Invalid folder name. Use lowercase letters, numbers, and hyphens only (e.g., "my-new-page")');
    }
    
    const pageFunctionName = await question(`${colors.cyan}Enter page function name (e.g., "MyNewPage") [default: ${toPascalCase(pageFolderName)}]: ${colors.reset}`) || toPascalCase(pageFolderName);
    
    const pageTitle = await question(`${colors.cyan}Enter page title (e.g., "My New Page"): ${colors.reset}`);
    if (!pageTitle) {
      throw new Error('Page title is required');
    }
    
    const pageDescription = await question(`${colors.cyan}Enter page description (e.g., "Manage your new feature"): ${colors.reset}`);
    if (!pageDescription) {
      throw new Error('Page description is required');
    }
    
    const iconName = await question(`${colors.cyan}Enter Lucide icon name (e.g., "FileText", "Database", "Settings"): ${colors.reset}`);
    if (!iconName) {
      throw new Error('Icon name is required');
    }
    
    const isLocked = (await question(`${colors.cyan}Should this page be always visible? (y/n) [default: n]: ${colors.reset}`)).toLowerCase() === 'y';
    
    const requireRole = !isLocked && (await question(`${colors.cyan}Require specific role? (SUPERADMIN/ADMIN/none) [default: none]: ${colors.reset}`)).toUpperCase();
    
    // Generate derived values
    const settingsKey = toShowFormat(pageFolderName);
    const navItemId = toCamelCase(pageFolderName);
    const href = `/${pageFolderName}`;
    
    console.log(`\n${colors.green}✓ Information collected:${colors.reset}`);
    console.log(`  - Folder: ${pageFolderName}`);
    console.log(`  - Function: ${pageFunctionName}`);
    console.log(`  - Title: ${pageTitle}`);
    console.log(`  - Description: ${pageDescription}`);
    console.log(`  - Icon: ${iconName}`);
    console.log(`  - Settings Key: ${settingsKey}`);
    console.log(`  - Locked: ${isLocked ? 'Yes' : 'No'}`);
    if (requireRole && requireRole !== 'NONE') {
      console.log(`  - Required Role: ${requireRole}`);
    }
    
    const confirm = await question(`\n${colors.yellow}Proceed with page creation? (y/n): ${colors.reset}`);
    if (confirm.toLowerCase() !== 'y') {
      console.log(`${colors.red}❌ Aborted by user${colors.reset}`);
      rl.close();
      return;
    }
    
    // Step 2: Create page structure
    console.log(`\n${colors.blue}📁 Step 2: Creating Page Structure${colors.reset}`);
    
    const pagePath = path.join(projectRoot, 'src', 'app', pageFolderName);
    
    if (fs.existsSync(pagePath)) {
      throw new Error(`Page folder already exists: ${pagePath}`);
    }
    
    // Create directories
    fs.mkdirSync(pagePath, { recursive: true });
    fs.mkdirSync(path.join(pagePath, 'components'), { recursive: true });
    fs.mkdirSync(path.join(pagePath, 'hooks'), { recursive: true });
    
    // Create .gitkeep files
    fs.writeFileSync(path.join(pagePath, 'components', '.gitkeep'), '');
    fs.writeFileSync(path.join(pagePath, 'hooks', '.gitkeep'), '');
    
    // Create page.tsx
    const pageContent = `import { DashboardLayout } from '@/components/layout';

export default function ${pageFunctionName}() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">${pageTitle}</h1>
        <p className="text-gray-600">${pageDescription}</p>
      </div>
    </DashboardLayout>
  );
}
`;
    
    fs.writeFileSync(path.join(pagePath, 'page.tsx'), pageContent);
    console.log(`${colors.green}✓ Created page structure at ${pagePath}${colors.reset}`);
    
    // Step 3: Update navigation.ts
    console.log(`\n${colors.blue}🧭 Step 3: Updating navigation.ts${colors.reset}`);
    
    const navigationPath = path.join(projectRoot, 'src', 'lib', 'constants', 'navigation.ts');
    let navigationContent = fs.readFileSync(navigationPath, 'utf8');
    
    // Add icon import if not exists
    const iconImportRegex = /import\s*{([^}]+)}\s*from\s*"lucide-react"/;
    const match = navigationContent.match(iconImportRegex);
    if (match) {
      const icons = match[1].split(',').map(i => i.trim());
      if (!icons.includes(iconName)) {
        icons.push(iconName);
        navigationContent = navigationContent.replace(iconImportRegex, `import { ${icons.join(', ')} } from "lucide-react"`);
      }
    }
    
    // Add navigation item before the closing bracket
    const navItem = `  {
    name: "${pageTitle}",
    href: "${href}",
    icon: ${iconName},
  },`;
    
    navigationContent = navigationContent.replace(/];[\s]*$/, `${navItem}\n];`);
    
    fs.writeFileSync(navigationPath, navigationContent);
    console.log(`${colors.green}✓ Updated navigation.ts${colors.reset}`);
    
    // Step 4: Update layoutNavigation.ts
    console.log(`\n${colors.blue}🗺️  Step 4: Updating layoutNavigation.ts${colors.reset}`);
    
    const layoutNavPath = path.join(projectRoot, 'src', 'lib', 'constants', 'layoutNavigation.ts');
    let layoutNavContent = fs.readFileSync(layoutNavPath, 'utf8');
    
    // Add icon import if not exists
    const layoutIconMatch = layoutNavContent.match(iconImportRegex);
    if (layoutIconMatch) {
      const icons = layoutIconMatch[1].split(',').map(i => i.trim());
      if (!icons.includes(iconName)) {
        icons.push(iconName);
        layoutNavContent = layoutNavContent.replace(iconImportRegex, `import { ${icons.join(', ')} } from "lucide-react"`);
      }
    }
    
    // Update LayoutSettings interface if not locked
    if (!isLocked) {
      const interfaceRegex = /export interface LayoutSettings \{([^}]+)\}/s;
      const interfaceMatch = layoutNavContent.match(interfaceRegex);
      if (interfaceMatch) {
        const fields = interfaceMatch[1];
        if (!fields.includes(settingsKey)) {
          // Find the last line in the interface and add new field before the closing brace
          // This ensures proper indentation and newlines
          layoutNavContent = layoutNavContent.replace(
            /(export interface LayoutSettings \{[\s\S]*?)(  \w+: boolean;)(\s*\n\})/,
            `$1$2\n  ${settingsKey}: boolean;$3`
          );
        }
      }
    }
    
    // Add layout navigation item
    let layoutNavItem = `  {
    id: "${navItemId}",
    label: "${pageTitle}",
    description: "${pageDescription}",
    href: "${href}",
    icon: ${iconName},
    locked: ${isLocked},`;
    
    if (!isLocked) {
      layoutNavItem += `\n    settingsKey: "${settingsKey}",`;
    }
    
    if (requireRole && requireRole !== 'NONE') {
      layoutNavItem += `\n    requireRole: ["${requireRole}"],`;
    }
    
    layoutNavItem += `\n  },`;
    
    // Find the settings item and insert before it
    const settingsItemRegex = /\{\s*id:\s*"settings",/;
    layoutNavContent = layoutNavContent.replace(settingsItemRegex, `${layoutNavItem}\n  {\n    id: "settings",`);
    
    fs.writeFileSync(layoutNavPath, layoutNavContent);
    console.log(`${colors.green}✓ Updated layoutNavigation.ts${colors.reset}`);
    
    let migrationName = ''; // Declare outside if block for use in summary
    let schemaUpdated = false; // Track if schema was actually modified
    
    if (!isLocked) {
      // Step 5: Update Prisma schema
      console.log(`\n${colors.blue}🗄️  Step 5: Updating Prisma Schema${colors.reset}`);
      
      const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');
      let schemaContent = fs.readFileSync(schemaPath, 'utf8');
      
      // Check if field already exists
      if (schemaContent.includes(settingsKey)) {
        console.log(`${colors.yellow}⚠️  Field ${settingsKey} already exists in schema, skipping schema update${colors.reset}`);
      } else {
        // Add field to LayoutSettings model
        const modelRegex = /model LayoutSettings \{([^}]+)\}/;
        const modelMatch = schemaContent.match(modelRegex);
        if (modelMatch) {
          const modelContent = modelMatch[1];
          // Find the last Boolean field line and add new field after it
          const lines = modelContent.split('\n');
          const lastBooleanIndex = lines.findIndex((line, idx) => 
            line.includes('Boolean') && 
            lines.slice(idx + 1).some(l => l.includes('createdAt'))
          );
          
          if (lastBooleanIndex !== -1) {
            lines.splice(lastBooleanIndex + 1, 0, `  ${settingsKey.padEnd(22)} Boolean  @default(true)`);
            const newModelContent = lines.join('\n');
            schemaContent = schemaContent.replace(modelRegex, `model LayoutSettings {${newModelContent}}`);
            schemaUpdated = true;
          }
        }
        
        if (schemaUpdated) {
          fs.writeFileSync(schemaPath, schemaContent);
          console.log(`${colors.green}✓ Updated schema.prisma${colors.reset}`);
        }
      }
      
      // Step 6: Sync database with Prisma schema (only if schema was updated)
      if (schemaUpdated) {
        console.log(`\n${colors.blue}🔄 Step 6: Syncing Database with Schema${colors.reset}`);
        
        try {
          // Use db push for development - it's faster and doesn't require migration files
          execSync(`npx prisma db push --accept-data-loss`, {
            cwd: projectRoot,
            stdio: 'inherit'
          });
          console.log(`${colors.green}✓ Database schema synced${colors.reset}`);
          
          console.log(`\n${colors.yellow}ℹ️  Note: Used 'prisma db push' for faster development.${colors.reset}`);
          console.log(`${colors.yellow}   For production, run 'npx prisma migrate dev' to create proper migrations.${colors.reset}`);
        } catch (error) {
          console.error(`\n${colors.red}✗ Database sync failed${colors.reset}`);
          console.error(`${colors.yellow}Troubleshooting:${colors.reset}`);
          console.error(`  1. Check database connection in .env.local`);
          console.error(`  2. Ensure DATABASE_URL is correct`);
          console.error(`  3. Try running: npx prisma db push manually`);
          throw error;
        }
      } else {
        console.log(`${colors.yellow}ℹ️  Skipping database sync (schema not modified)${colors.reset}`);
      }
      
      // Step 7: Update API route
      console.log(`\n${colors.blue}🔌 Step 7: Updating API Route${colors.reset}`);
      
      const apiRoutePath = path.join(projectRoot, 'src', 'app', 'api', 'settings', 'layout-settings', 'route.ts');
      let apiContent = fs.readFileSync(apiRoutePath, 'utf8');
      
      // Check if field already exists in API route
      if (apiContent.includes(settingsKey)) {
        console.log(`${colors.yellow}⚠️  Field ${settingsKey} already exists in API route, skipping API update${colors.reset}`);
      } else {
        // Update GET method - create section
        // Find the last property before closing brace in the create data object
        apiContent = apiContent.replace(
          /(settings = await prisma\.layoutSettings\.create\(\{\s*data:\s*\{[\s\S]*?)(          \w+: \w+,?)(\s*\n        \},)/m,
          `$1$2\n          ${settingsKey}: true,$3`
        );
        
        // Update PATCH method - destructure
        // Add to the destructuring - find last variable in destructure
        apiContent = apiContent.replace(
          /(const \{[\s\S]*?)(\w+)( \} = body;)/,
          `$1$2, ${settingsKey}$3`
        );
        
        // Update PATCH method - create section (in if (!settings) block)
        apiContent = apiContent.replace(
          /(if \(!settings\) \{[\s\S]*?settings = await prisma\.layoutSettings\.create\(\{[\s\S]*?data:\s*\{[\s\S]*?)(          \w+: \w+ \?\? \w+,?)(\s*\n        \},)/m,
          `$1$2\n          ${settingsKey}: ${settingsKey} ?? true,$3`
        );
        
        // Update PATCH method - update section (in else block)
        apiContent = apiContent.replace(
          /(} else \{[\s\S]*?settings = await prisma\.layoutSettings\.update\(\{[\s\S]*?data:\s*\{[\s\S]*?)(          \w+: \w+ \?\? settings\.\w+,?)(\s*\n        \},)/m,
          `$1$2\n          ${settingsKey}: ${settingsKey} ?? settings.${settingsKey},$3`
        );
        
        fs.writeFileSync(apiRoutePath, apiContent);
        console.log(`${colors.green}✓ Updated API route${colors.reset}`);
      }
      
      // Step 8: Update SideNav
      console.log(`\n${colors.blue}🎨 Step 8: Updating SideNav Component${colors.reset}`);
      
      const sideNavPath = path.join(projectRoot, 'src', 'components', 'layout', 'SideNav.tsx');
      let sideNavContent = fs.readFileSync(sideNavPath, 'utf8');
      
      // Check if field already exists
      if (sideNavContent.includes(`${settingsKey}:`)) {
        console.log(`${colors.yellow}⚠️  Field ${settingsKey} already exists in SideNav, skipping SideNav update${colors.reset}`);
      } else {
        // Update default state - find the last property before closing brace and add new field
        // Match the last property line ending with comma or no comma
        sideNavContent = sideNavContent.replace(
          /(const \[layoutSettings, setLayoutSettings\] = useState<LayoutSettings>\(\{[\s\S]*?)(    \w+: \w+,?)(\s*\n  \}\);)/m,
          `$1$2\n    ${settingsKey}: true,$3`
        );
        
        // Update fetchLayoutSettings - find last property and add new field
        sideNavContent = sideNavContent.replace(
          /(const settings: LayoutSettings = \{[\s\S]*?)(        \w+: data\.\w+,?)(\s*\n      \};)/m,
          `$1$2\n        ${settingsKey}: data.${settingsKey},$3`
        );
        
        fs.writeFileSync(sideNavPath, sideNavContent);
        console.log(`${colors.green}✓ Updated SideNav.tsx${colors.reset}`);
      }
      
      // Step 9: Update LayoutSettingsTab
      console.log(`\n${colors.blue}⚙️  Step 9: Updating LayoutSettingsTab Component${colors.reset}`);
      
      const settingsTabPath = path.join(projectRoot, 'src', 'app', 'settings', 'components', 'LayoutSettingsTab.tsx');
      let settingsTabContent = fs.readFileSync(settingsTabPath, 'utf8');
      
      // Check if field already exists
      if (settingsTabContent.includes(`${settingsKey}:`)) {
        console.log(`${colors.yellow}⚠️  Field ${settingsKey} already exists in LayoutSettingsTab, skipping LayoutSettingsTab update${colors.reset}`);
      } else {
        // Update initial state - find the last property before closing brace and add new field
        settingsTabContent = settingsTabContent.replace(
          /(const \[settings, setSettings\] = useState<LayoutSettings>\(\{[\s\S]*?)(    \w+: \w+,?)(\s*\n  \}\);)/m,
          `$1$2\n    ${settingsKey}: true,$3`
        );
        
        // Update fetchSettings - find last property in setSettings and add new field
        settingsTabContent = settingsTabContent.replace(
          /(setSettings\(\{[\s\S]*?)(          \w+: data\.\w+,?)(\s*\n        \}\);)/m,
          `$1$2\n          ${settingsKey}: data.${settingsKey},$3`
        );
        
        fs.writeFileSync(settingsTabPath, settingsTabContent);
        console.log(`${colors.green}✓ Updated LayoutSettingsTab.tsx${colors.reset}`);
      }
    } else {
      console.log(`\n${colors.yellow}ℹ️  Skipping schema/database updates (page is locked/always visible)${colors.reset}`);
    }
    
    // Step 10: Summary
    console.log(`\n${colors.green}
╔════════════════════════════════════════════════════════════╗
║                  ✅ Page Created Successfully!             ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`);
    
    console.log(`\n${colors.cyan}📄 Created Files:${colors.reset}`);
    console.log(`  ✓ ${pageFolderName}/page.tsx`);
    console.log(`  ✓ ${pageFolderName}/components/.gitkeep`);
    console.log(`  ✓ ${pageFolderName}/hooks/.gitkeep`);
    
    console.log(`\n${colors.cyan}🔄 Updated Files:${colors.reset}`);
    console.log(`  ✓ src/lib/constants/navigation.ts`);
    console.log(`  ✓ src/lib/constants/layoutNavigation.ts`);
    
    if (!isLocked) {
      console.log(`  ✓ prisma/schema.prisma`);
      console.log(`  ✓ src/app/api/settings/layout-settings/route.ts`);
      console.log(`  ✓ src/components/layout/SideNav.tsx`);
      console.log(`  ✓ src/app/settings/components/LayoutSettingsTab.tsx`);
      if (schemaUpdated) {
        console.log(`\n${colors.cyan}💾 Database:${colors.reset}`);
        console.log(`  ✓ Schema synced with db push`);
        console.log(`  ℹ️  No migration files created (using db push for development)`);
      } else if (!schemaUpdated) {
        console.log(`\n${colors.cyan}💾 Database:${colors.reset}`);
        console.log(`  ℹ️  No changes needed (field already exists)`);
      }
    }
    
    console.log(`\n${colors.cyan}🎯 Next Steps:${colors.reset}`);
    console.log(`  1. Visit http://localhost:3000${href} to see your new page`);
    console.log(`  2. Start building your page components in ${pageFolderName}/components/`);
    console.log(`  3. Add custom hooks in ${pageFolderName}/hooks/`);
    if (!isLocked) {
      console.log(`  4. Toggle page visibility in Settings > Layout Settings`);
    }
    
    console.log(`\n${colors.green}🎉 Happy coding!${colors.reset}\n`);
    
  } catch (error) {
    console.error(`\n${colors.red}❌ Error: ${error.message}${colors.reset}\n`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
