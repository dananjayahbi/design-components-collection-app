import { Users, Blinds, ScanEye, Settings, User, LayoutDashboard, FileUp, TestTube } from "lucide-react";

/**
 * Layout Navigation Configuration
 *
 * This file centralizes all navigation items configuration including:
 * - Navigation display in SideNav
 * - Layout Settings toggles
 * - Icons, labels, and descriptions
 *
 * To add a new page:
 * 1. Create the page component in src/app/[page-name]/page.tsx
 * 2. Import the desired icon from 'lucide-react' at the top of this file
 * 3. Add a new item to layoutNavigationItems array
 * 4. Update LayoutSettings type in prisma/schema.prisma if needed
 * 5. Update API route at src/app/api/settings/layout-settings/route.ts
 */

export interface LayoutNavItem {
  id: string; // Unique identifier, matches LayoutSettings field name for toggleable items
  label: string; // Display name
  description: string; // Description for settings page
  href: string; // URL path
  icon: React.ComponentType<{ className?: string }>; // Lucide icon
  locked: boolean; // If true, cannot be disabled (always visible)
  settingsKey?: keyof LayoutSettings; // Key in LayoutSettings interface for toggleable items
  requireRole?: string[]; // Optional role requirement
}

/**
 * Layout Settings Interface
 * Must match the LayoutSettings model in prisma/schema.prisma
 */
export interface LayoutSettings {
  showGenerateContent: boolean;
  showViewContent: boolean;
  showUploadContent: boolean;}

/**
 * All Layout Navigation Items
 * 
 * Items with locked: true are always visible (Dashboard, User Management, Settings, Profile)
 * Items with locked: false can be toggled in Layout Settings
 * Items with requireRole will only show for users with that role
 */
export const layoutNavigationItems: LayoutNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Main dashboard page",
    href: "/dashboard",
    icon: LayoutDashboard,
    locked: true,
  },
  {
    id: "userManagement",
    label: "User Management",
    description: "Manage users and permissions",
    href: "/user-management",
    icon: Users,
    locked: true,
    requireRole: ["SUPERADMIN"], // Only SUPERADMIN can see this
  },
  {
    id: "showGenerateContent",
    label: "Generate Content",
    description: "Create quotes and backgrounds",
    href: "/generate-content",
    icon: Blinds,
    locked: false,
    settingsKey: "showGenerateContent",
  },
  {
    id: "showViewContent",
    label: "View Content",
    description: "Browse saved quotes and backgrounds",
    href: "/view-content",
    icon: ScanEye,
    locked: false,
    settingsKey: "showViewContent",
  },
  {
    id: "uploadContent",
    label: "Upload Content",
    description: "Upload and manage your content",
    href: "/upload-content",
    icon: FileUp,
    locked: false,
    settingsKey: "showUploadContent",
  },{
    id: "settings",
    label: "Settings",
    description: "Application settings",
    href: "/settings",
    icon: Settings,
    locked: true,
  },
  {
    id: "profile",
    label: "Profile",
    description: "User profile settings",
    href: "/profile",
    icon: User,
    locked: true,
  },
];

/**
 * Helper: Get toggleable navigation items (for Layout Settings page)
 */
export const getToggleableNavItems = () => {
  return layoutNavigationItems.filter((item) => !item.locked);
};

/**
 * Helper: Get locked navigation items (always visible)
 */
export const getLockedNavItems = () => {
  return layoutNavigationItems.filter((item) => item.locked);
};

/**
 * Helper: Get filtered navigation items based on user role and settings
 */
export const getFilteredNavItems = (
  userRole: string | undefined,
  layoutSettings: LayoutSettings
) => {
  return layoutNavigationItems.filter((item) => {
    // Filter by role requirement
    if (item.requireRole && (!userRole || !item.requireRole.includes(userRole))) {
      return false;
    }

    // Filter by layout settings (only for non-locked items)
    if (!item.locked && item.settingsKey) {
      return layoutSettings[item.settingsKey];
    }

    return true;
  });
};
