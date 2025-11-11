#!/usr/bin/env node

/**
 * Automated Page Removal Script
 * 
 * This script automates the entire process of removing a page from the dashboard,
 * including cleaning up all file updates, schema changes, and database migrations.
 * 
 * Usage: node remove-page.js
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
║       🗑️  Automated Page Removal Script                   ║
║       Dashboard Page Remover with Full Cleanup            ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`);

async function main() {
  try {
    // Step 1: Get user inputs
    console.log(`\n${colors.blue}📝 Step 1: Collecting Page Information${colors.reset}`);
    
    const pageFolderName = await question(`\n${colors.cyan}Enter page folder name to remove (e.g., "my-page"): ${colors.reset}`);
    if (!pageFolderName || !/^[a-z][a-z0-9-]*$/.test(pageFolderName)) {
      throw new Error('Invalid folder name. Use lowercase letters, numbers, and hyphens only (e.g., "my-page")');
    }
    
    // Generate derived values
    const settingsKey = toShowFormat(pageFolderName);
    const navItemId = toCamelCase(pageFolderName);
    const href = `/${pageFolderName}`;
    
    // Check if page exists
    const pagePath = path.join(projectRoot, 'src', 'app', pageFolderName);
    if (!fs.existsSync(pagePath)) {
      throw new Error(`Page folder does not exist: ${pagePath}`);
    }
    
    console.log(`\n${colors.green}✓ Page found:${colors.reset}`);
    console.log(`  - Folder: ${pageFolderName}`);
    console.log(`  - Settings Key: ${settingsKey}`);
    console.log(`  - Nav Item ID: ${navItemId}`);
    console.log(`  - Route: ${href}`);
    
    const confirm = await question(`\n${colors.yellow}⚠️  Are you sure you want to remove this page? (yes/no): ${colors.reset}`);
    if (confirm.toLowerCase() !== 'yes') {
      console.log(`${colors.red}❌ Aborted by user${colors.reset}`);
      rl.close();
      return;
    }
    
    // Step 2: Remove page structure
    console.log(`\n${colors.blue}📁 Step 2: Removing Page Structure${colors.reset}`);
    
    // Remove directory recursively
    fs.rmSync(pagePath, { recursive: true, force: true });
    console.log(`${colors.green}✓ Removed page folder: ${pagePath}${colors.reset}`);
    
    // Step 3: Update navigation.ts
    console.log(`\n${colors.blue}🧭 Step 3: Updating navigation.ts${colors.reset}`);
    
    const navigationPath = path.join(projectRoot, 'src', 'lib', 'constants', 'navigation.ts');
    let navigationContent = fs.readFileSync(navigationPath, 'utf8');
    
    // Remove navigation item - find the object with matching href
    const navItemRegex = new RegExp(`\\s*\\{[^}]*href:\\s*"${href}"[^}]*\\},?\\n`, 'g');
    navigationContent = navigationContent.replace(navItemRegex, '');
    
    fs.writeFileSync(navigationPath, navigationContent);
    console.log(`${colors.green}✓ Updated navigation.ts${colors.reset}`);
    
    // Step 4: Update layoutNavigation.ts
    console.log(`\n${colors.blue}🗺️  Step 4: Updating layoutNavigation.ts${colors.reset}`);
    
    const layoutNavPath = path.join(projectRoot, 'src', 'lib', 'constants', 'layoutNavigation.ts');
    let layoutNavContent = fs.readFileSync(layoutNavPath, 'utf8');
    
    // Check if this is a settings-controlled page
    const hasSettingsKey = layoutNavContent.includes(`settingsKey: "${settingsKey}"`);
    
    // Remove layout navigation item
    // This regex matches the entire object including all its properties across multiple lines
    const layoutNavItemRegex = new RegExp(
      `\\s*\\{[^}]*id:\\s*"${navItemId}"[^}]*\\},?\\s*\\n?`,
      'gs'
    );
    layoutNavContent = layoutNavContent.replace(layoutNavItemRegex, '');
    
    // Remove from LayoutSettings interface if it has a settings key
    if (hasSettingsKey) {
      // Match the entire line including leading whitespace
      const interfaceFieldRegex = new RegExp(`^\\s*${settingsKey}:\\s*boolean;\\s*\\n`, 'gm');
      layoutNavContent = layoutNavContent.replace(interfaceFieldRegex, '');
    }
    
    fs.writeFileSync(layoutNavPath, layoutNavContent);
    console.log(`${colors.green}✓ Updated layoutNavigation.ts${colors.reset}`);
    
    if (hasSettingsKey) {
      // Step 5: Update Prisma schema
      console.log(`\n${colors.blue}🗄️  Step 5: Updating Prisma Schema${colors.reset}`);
      
      const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');
      let schemaContent = fs.readFileSync(schemaPath, 'utf8');
      
      // Remove field from LayoutSettings model
      // Match the entire line including leading whitespace but preserve the newline structure
      const schemaFieldRegex = new RegExp(`^\\s*${settingsKey}\\s+Boolean\\s+@default\\(true\\)\\s*\\n`, 'gm');
      schemaContent = schemaContent.replace(schemaFieldRegex, '');
      
      fs.writeFileSync(schemaPath, schemaContent);
      console.log(`${colors.green}✓ Updated schema.prisma${colors.reset}`);
      
      // Step 6: Sync database with Prisma schema
      console.log(`\n${colors.blue}🔄 Step 6: Syncing Database with Schema${colors.reset}`);
      
      try {
        execSync(`npx prisma db push --accept-data-loss`, {
          cwd: projectRoot,
          stdio: 'inherit'
        });
        console.log(`${colors.green}✓ Database schema synced${colors.reset}`);
      } catch (error) {
        console.error(`\n${colors.red}✗ Database sync failed${colors.reset}`);
        console.error(`${colors.yellow}Troubleshooting:${colors.reset}`);
        console.error(`  1. Check database connection in .env.local`);
        console.error(`  2. Ensure DATABASE_URL is correct`);
        console.error(`  3. Try running: npx prisma db push manually`);
        throw error;
      }
      
      // Step 7: Update API route
      console.log(`\n${colors.blue}🔌 Step 7: Updating API Route${colors.reset}`);
      
      const apiRoutePath = path.join(projectRoot, 'src', 'app', 'api', 'settings', 'layout-settings', 'route.ts');
      let apiContent = fs.readFileSync(apiRoutePath, 'utf8');
      
      // Remove from GET method - create section
      // Match the entire property line: "  propertyName: value,"
      const getCreateFieldRegex = new RegExp(`^\\s*${settingsKey}:\\s*[^,\\n]+,?\\s*\\n`, 'gm');
      apiContent = apiContent.replace(getCreateFieldRegex, '');
      
      // Remove from PATCH method - destructure
      const destructureRegex = new RegExp(`,\\s*${settingsKey}(?=\\s*\\})`, 'g');
      apiContent = apiContent.replace(destructureRegex, '');
      
      // Remove from PATCH method - create and update sections
      // Match the entire property line with proper formatting
      const patchFieldRegex = new RegExp(`^\\s*${settingsKey}:\\s*${settingsKey}[^\\n]*\\n`, 'gm');
      apiContent = apiContent.replace(patchFieldRegex, '');
      
      fs.writeFileSync(apiRoutePath, apiContent);
      console.log(`${colors.green}✓ Updated API route${colors.reset}`);
      
      // Step 8: Update SideNav
      console.log(`\n${colors.blue}🎨 Step 8: Updating SideNav Component${colors.reset}`);
      
      const sideNavPath = path.join(projectRoot, 'src', 'components', 'layout', 'SideNav.tsx');
      let sideNavContent = fs.readFileSync(sideNavPath, 'utf8');
      
      // Remove from default state - match entire property line
      const sideNavStateFieldRegex = new RegExp(`^\\s*${settingsKey}:\\s*[^,\\n]+,?\\s*\\n`, 'gm');
      sideNavContent = sideNavContent.replace(sideNavStateFieldRegex, '');
      
      // Remove from fetchLayoutSettings - match entire property line
      const sideNavFetchFieldRegex = new RegExp(`^\\s*${settingsKey}:\\s*data\\.${settingsKey},?\\s*\\n`, 'gm');
      sideNavContent = sideNavContent.replace(sideNavFetchFieldRegex, '');
      
      fs.writeFileSync(sideNavPath, sideNavContent);
      console.log(`${colors.green}✓ Updated SideNav.tsx${colors.reset}`);
      
      // Step 9: Update LayoutSettingsTab
      console.log(`\n${colors.blue}⚙️  Step 9: Updating LayoutSettingsTab Component${colors.reset}`);
      
      const settingsTabPath = path.join(projectRoot, 'src', 'app', 'settings', 'components', 'LayoutSettingsTab.tsx');
      let settingsTabContent = fs.readFileSync(settingsTabPath, 'utf8');
      
      // Remove from initial state - match entire property line
      const settingsTabStateFieldRegex = new RegExp(`^\\s*${settingsKey}:\\s*[^,\\n]+,?\\s*\\n`, 'gm');
      settingsTabContent = settingsTabContent.replace(settingsTabStateFieldRegex, '');
      
      // Remove from fetchSettings - match entire property line
      const settingsTabFetchFieldRegex = new RegExp(`^\\s*${settingsKey}:\\s*data\\.${settingsKey},?\\s*\\n`, 'gm');
      settingsTabContent = settingsTabContent.replace(settingsTabFetchFieldRegex, '');
      
      fs.writeFileSync(settingsTabPath, settingsTabContent);
      console.log(`${colors.green}✓ Updated LayoutSettingsTab.tsx${colors.reset}`);
    } else {
      console.log(`\n${colors.yellow}ℹ️  Page is locked/always visible - skipping schema and settings updates${colors.reset}`);
    }
    
    // Step 10: Generate Prisma client
    console.log(`\n${colors.blue}🔧 Step 10: Generating Prisma Client${colors.reset}`);
    
    try {
      execSync(`npx prisma generate`, {
        cwd: projectRoot,
        stdio: 'inherit'
      });
      console.log(`${colors.green}✓ Prisma client generated${colors.reset}`);
    } catch (error) {
      console.error(`\n${colors.red}✗ Prisma generate failed${colors.reset}`);
      console.error(`${colors.yellow}Try running: npx prisma generate manually${colors.reset}`);
      throw error;
    }
    
    // Step 11: Summary
    console.log(`\n${colors.green}
╔════════════════════════════════════════════════════════════╗
║                  ✅ Page Removed Successfully!             ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`);
    
    console.log(`\n${colors.cyan}📄 Deleted:${colors.reset}`);
    console.log(`  ✓ ${pageFolderName}/ (entire folder)`);
    
    console.log(`\n${colors.cyan}🔄 Updated Files:${colors.reset}`);
    console.log(`  ✓ src/lib/constants/navigation.ts`);
    console.log(`  ✓ src/lib/constants/layoutNavigation.ts`);
    
    if (hasSettingsKey) {
      console.log(`  ✓ prisma/schema.prisma`);
      console.log(`  ✓ src/app/api/settings/layout-settings/route.ts`);
      console.log(`  ✓ src/components/layout/SideNav.tsx`);
      console.log(`  ✓ src/app/settings/components/LayoutSettingsTab.tsx`);
      console.log(`\n${colors.cyan}💾 Database:${colors.reset}`);
      console.log(`  ✓ Schema synced with db push`);
    }
    
    console.log(`\n${colors.cyan}🔧 Generated:${colors.reset}`);
    console.log(`  ✓ Prisma client regenerated`);
    
    console.log(`\n${colors.green}🎉 Page successfully removed from the dashboard!${colors.reset}\n`);
    
  } catch (error) {
    console.error(`\n${colors.red}❌ Error: ${error.message}${colors.reset}\n`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
