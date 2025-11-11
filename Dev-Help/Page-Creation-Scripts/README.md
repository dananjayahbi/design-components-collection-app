# Page Creation Scripts

Automated scripts to simplify the process of creating new pages in the dashboard.

## 🚀 Quick Start

### Create a New Page

```bash
node Dev-Help/Page-Creation-Scripts/create-page.js
```

The script will guide you through an interactive process to create a complete page with all necessary integrations.

## 📋 What the Script Does

The automated page creation script handles the following tasks:

### 1. **Page Structure Creation**
- Creates `src/app/[page-name]/` directory
- Adds `page.tsx` with the standard template
- Creates `components/` and `hooks/` subdirectories
- Adds `.gitkeep` files to maintain folder structure

### 2. **Navigation Updates**
- Updates `src/lib/constants/navigation.ts`
  - Adds icon import
  - Adds navigation item
- Updates `src/lib/constants/layoutNavigation.ts`
  - Adds icon import
  - Adds layout navigation item with settings
  - Updates `LayoutSettings` interface (for toggleable pages)

### 3. **Database Schema (for toggleable pages)**
- Updates `prisma/schema.prisma`
  - Adds new Boolean field to `LayoutSettings` model
- Runs `npx prisma migrate dev`
  - Creates migration file
  - Applies migration to database
  - Regenerates Prisma Client

### 4. **API Route Updates (for toggleable pages)**
- Updates `src/app/api/settings/layout-settings/route.ts`
  - Adds field to GET method (create default)
  - Adds field to PATCH method (destructure, create, update)

### 5. **Component Updates (for toggleable pages)**
- Updates `src/components/layout/SideNav.tsx`
  - Adds field to default state
  - Adds field to fetchLayoutSettings
- Updates `src/app/settings/components/LayoutSettingsTab.tsx`
  - Adds field to initial state
  - Adds field to fetchSettings

## 🎮 Interactive Prompts

When you run the script, you'll be asked for:

1. **Page folder name** (e.g., `my-new-page`)
   - Must be lowercase with hyphens
   - Will be used in the URL: `/my-new-page`

2. **Page function name** (e.g., `MyNewPage`)
   - PascalCase React component name
   - Default: auto-generated from folder name

3. **Page title** (e.g., `My New Page`)
   - Display name in navigation and page header

4. **Page description** (e.g., `Manage your new feature`)
   - Shown below the page title

5. **Icon name** (e.g., `FileText`)
   - Must be a valid [Lucide React](https://lucide.dev/) icon name

6. **Always visible?** (y/n)
   - `y`: Page is locked (always visible, cannot be toggled)
   - `n`: Page is toggleable in Layout Settings

7. **Required role** (SUPERADMIN/ADMIN/none)
   - Only asked if page is not locked
   - Restricts access to specific user roles

## 📝 Example Usage

```bash
$ node Dev-Help/Page-Creation-Scripts/create-page.js

Enter page folder name: analytics-dashboard
Enter page function name: AnalyticsDashboard
Enter page title: Analytics Dashboard
Enter page description: View and analyze your performance metrics
Enter Lucide icon name: BarChart3
Should this page be always visible? (y/n): n
Require specific role? (SUPERADMIN/ADMIN/none): none

Proceed with page creation? (y/n): y

✓ Created page structure
✓ Updated navigation.ts
✓ Updated layoutNavigation.ts
✓ Updated schema.prisma
✓ Migration completed
✓ Updated API route
✓ Updated SideNav.tsx
✓ Updated LayoutSettingsTab.tsx

✅ Page Created Successfully!
```

## 📂 Resulting Structure

After running the script, you'll have:

```
src/app/analytics-dashboard/
  ├── page.tsx
  ├── components/
  │   └── .gitkeep
  └── hooks/
      └── .gitkeep
```

With the following template in `page.tsx`:

```tsx
import { DashboardLayout } from '@/components/layout';

export default function AnalyticsDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600">View and analyze your performance metrics</p>
      </div>
    </DashboardLayout>
  );
}
```

## ✅ Validation Steps

The script performs validation at each step:

1. **Folder name validation**: Ensures lowercase with hyphens only
2. **Duplicate check**: Prevents overwriting existing pages
3. **Icon import check**: Only adds import if not already present
4. **Schema field check**: Prevents duplicate fields
5. **Migration execution**: Catches and reports database errors
6. **File existence check**: Verifies all required files exist

## 🔧 Manual Steps (if needed)

If you need to make manual changes:

1. **Add protected route**: Wrap page with `<ProtectedPage>` in `page.tsx`
2. **Add custom components**: Create in `components/` folder
3. **Add custom hooks**: Create in `hooks/` folder
4. **Update page content**: Modify the template in `page.tsx`

## 🚨 Troubleshooting

### Migration fails
- Ensure database connection is working
- Check `.env.local` file for valid `DATABASE_URL`
- Verify Prisma schema syntax

### Icon not found
- Verify icon name exists at [lucide.dev](https://lucide.dev/)
- Use exact PascalCase name (e.g., `FileText`, not `file-text`)

### Page not showing in navigation
- Check if you're logged in
- If toggleable, check Layout Settings to enable it
- If role-restricted, verify your user role

## 📚 Related Documentation

- [Navigation Configuration](../../src/lib/constants/navigation.ts)
- [Layout Navigation Configuration](../../src/lib/constants/layoutNavigation.ts)
- [Prisma Schema](../../prisma/schema.prisma)
- [Layout Settings API](../../src/app/api/settings/layout-settings/route.ts)

## 🎯 Best Practices

1. **Use descriptive names**: Choose clear, meaningful page names
2. **Follow naming conventions**: kebab-case for folders, PascalCase for components
3. **Test after creation**: Visit the page to ensure it renders correctly
4. **Add authentication**: Use `<ProtectedPage>` wrapper for protected routes
5. **Keep organized**: Use `components/` and `hooks/` folders for related code

## 🔄 Future Enhancements

Potential improvements for the script:

- [ ] Option to add protected route automatically
- [ ] Template selection (basic, data table, form, etc.)
- [ ] Automatic test file generation
- [ ] API route scaffolding
- [ ] Component library templates
