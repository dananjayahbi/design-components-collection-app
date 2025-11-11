# Page Removal Script

This script automates the removal of pages from the dashboard, cleaning up all associated files and configurations.

## Features

- ✅ **Complete Cleanup**: Removes page folder, navigation entries, and all related code
- ✅ **Schema Updates**: Automatically updates Prisma schema and syncs database
- ✅ **Settings Removal**: Cleans up layout settings if the page was toggleable
- ✅ **API Updates**: Removes references from API routes
- ✅ **Component Updates**: Cleans SideNav and LayoutSettingsTab components
- ✅ **Safe Operation**: Confirms before deletion with clear summary

## Usage

### Run the Script

```bash
node Dev-Help/Page-Removal-Script/remove-page.js
```

### Follow the Prompts

1. **Enter page folder name**: The name of the page folder to remove (e.g., "my-page")
2. **Confirm deletion**: Type "yes" to proceed with removal

### Example

```bash
$ node Dev-Help/Page-Removal-Script/remove-page.js

╔════════════════════════════════════════════════════════════╗
║       🗑️  Automated Page Removal Script                   ║
║       Dashboard Page Remover with Full Cleanup            ║
╚════════════════════════════════════════════════════════════╝

📝 Step 1: Collecting Page Information

Enter page folder name to remove (e.g., "my-page"): temp

✓ Page found:
  - Folder: temp
  - Settings Key: showTemp
  - Nav Item ID: temp
  - Route: /temp

⚠️  Are you sure you want to remove this page? (yes/no): yes
```

## What Gets Removed

### Files Deleted
- ✅ `src/app/[page-name]/` - Entire page folder including components and hooks

### Files Updated
- ✅ `src/lib/constants/navigation.ts` - Navigation item removed
- ✅ `src/lib/constants/layoutNavigation.ts` - Layout navigation item and interface field removed
- ✅ `prisma/schema.prisma` - Field removed from LayoutSettings model (if toggleable)
- ✅ `src/app/api/settings/layout-settings/route.ts` - API logic updated (if toggleable)
- ✅ `src/components/layout/SideNav.tsx` - Component state updated (if toggleable)
- ✅ `src/app/settings/components/LayoutSettingsTab.tsx` - Settings UI updated (if toggleable)

### Database Operations
- ✅ Syncs database schema with `prisma db push`
- ✅ Regenerates Prisma client with `prisma generate`

## Important Notes

### Locked vs Toggleable Pages

- **Locked pages** (Dashboard, Settings, Profile, User Management): Only removes from navigation files
- **Toggleable pages**: Full cleanup including schema, database, and settings components

### Database Sync

The script uses `prisma db push` for development speed. For production:
```bash
npx prisma migrate dev --name remove_[page_name]
```

### Backup Recommendation

Before running the script, consider:
1. Creating a git commit of your current state
2. Backing up your database
3. Reviewing what will be removed

## Troubleshooting

### Database Sync Failed
```bash
# Check database connection
# Ensure DATABASE_URL in .env.local is correct
# Try manual sync:
npx prisma db push
```

### Prisma Generate Failed
```bash
# Try manual generation:
npx prisma generate
```

### Page Not Found
- Ensure you're using the exact folder name (lowercase with hyphens)
- Check if the page exists in `src/app/[page-name]/`

## Related Scripts

- **Page Creation**: `Dev-Help/Page-Creation-Scripts/create-page.js`
- Creates new pages with full integration

## Support

For issues or questions, check:
1. The error message output
2. Database connection settings
3. Prisma schema validity
