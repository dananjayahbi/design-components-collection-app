"use client";

import { User, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-transparent z-40">
      <div className="h-full px-8 flex items-center justify-end border-b border-gray-200">
        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            className="w-10 h-10 rounded-full bg-[#5B50E8] flex items-center justify-center hover:bg-[#4A3FD7] transition-colors duration-200 shadow-md"
            aria-label="User profile"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <User className="w-5 h-5 text-white" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
              {session?.user && (
                <>
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{session.user.name}</p>
                    <p className="text-xs text-gray-600">{session.user.email}</p>
                    <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                      {session.user.role}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
