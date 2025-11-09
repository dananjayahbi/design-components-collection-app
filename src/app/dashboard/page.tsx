"use client";

import { DashboardLayout } from '@/components/layout';
import { ProtectedPage } from '@/components/wrappers/auth';
import { useSession } from 'next-auth/react';

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <ProtectedPage>
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to your admin dashboard, {session?.user?.name}!</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Role</h3>
              <p className="text-2xl font-bold text-purple-600">{session?.user?.role}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-sm text-gray-600">{session?.user?.email}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Status</h3>
              <p className="text-sm font-medium text-green-600">Active</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedPage>
  );
}