"use client";

import SideNav from "./SideNav";
import Header from "./Header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Side Navigation */}
      <SideNav />
      
      {/* Header */}
      <Header />
      
      {/* Main Content Area - With left padding and top padding for header */}
      <main className="min-h-screen pl-18 pt-14">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
