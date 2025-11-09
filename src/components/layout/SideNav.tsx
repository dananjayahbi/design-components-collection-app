"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { navigationItems } from "@/lib/constants";

/**
 * SideNav Component
 * 
 * This component renders the compact side navigation menu.
 * 
 * Navigation items are managed in: src/lib/constants/navigation.ts
 * To add, update, or delete menu items, edit the navigationItems array in that file.
 * 
 * Note: Dashboard and User Profile items are hard-coded in this component
 * as they have special styling and positioning.
 */
export default function SideNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string) => {
    return pathname === href;
  };

  const isDashboardActive = pathname === '/dashboard';

  // Filter navigation items based on user role
  const filteredNavItems = navigationItems.filter((item) => {
    // Hide User Management for non-superadmin users
    if (item.href === "/user-management" && session?.user?.role !== "SUPERADMIN") {
      return false;
    }
    return true;
  });

  return (
    <aside className="fixed left-3 top-1/2 -translate-y-1/2 z-50">
      {/* Compact Modern Side Navigation - Light Mode */}
      <div className="bg-[#5B50E8] rounded-[28px] p-2 shadow-xl">
        {/* Dashboard Icon at top - Separate with rounded top corners */}
        <div className="mb-3 flex items-center justify-center">
          <Link
            href="/dashboard"
            className={`
              group relative w-12 h-12 flex items-center justify-center rounded-t-[20px] rounded-b-2xl transition-all duration-300
              ${isDashboardActive 
                ? "bg-white shadow-lg scale-105" 
                : "bg-white/20 hover:bg-white/30 hover:scale-105"
              }
            `}
            title="Dashboard"
          >
            <LayoutDashboard className={`w-6 h-6 transition-colors ${isDashboardActive ? "text-[#5B50E8]" : "text-white"}`} />
            
            {/* Tooltip on hover */}
            <div className="absolute left-full ml-4 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap shadow-lg">
              Dashboard
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-gray-800"></div>
            </div>
          </Link>
        </div>

        {/* Navigation Icons - Dynamically rendered from config */}
        <nav className="space-y-2">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300
                  ${active 
                    ? "bg-white shadow-lg scale-105" 
                    : "hover:bg-white/20 hover:scale-105"
                  }
                `}
                title={item.name}
              >
                <Icon className={`w-5 h-5 transition-colors ${active ? "text-[#5B50E8]" : "text-white"}`} />
                
                {/* Tooltip on hover */}
                <div className="absolute left-full ml-4 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap shadow-lg">
                  {item.name}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-gray-800"></div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Profile at bottom */}
        <div className="mt-3 pt-3 border-t border-white/20">
          <Link
            href="/profile"
            className="group relative w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-white/20 hover:scale-105 transition-all"
            title="Profile"
          >
            <div className="w-9 h-9 rounded-full bg-linear-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            
            {/* Tooltip */}
            <div className="absolute left-full ml-4 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap shadow-lg">
              Profile
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-gray-800"></div>
            </div>
          </Link>
        </div>
      </div>
    </aside>
  );
}
