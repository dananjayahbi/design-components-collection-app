"use client";

import { DashboardLayout } from '@/components/layout';
import { ProtectedPage } from '@/components/wrappers/auth';
import { PageLoader } from '@/components/common';
import { Select } from '@/components/ui';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface RegistrationRequest {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  status: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function UserManagementPage() {
  const [pendingRequests, setPendingRequests] = useState<RegistrationRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [requestsRes, usersRes] = await Promise.all([
        fetch("/api/admin/registration-requests"),
        fetch("/api/admin/users"),
      ]);

      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setPendingRequests(requestsData);
        // Initialize role selections
        const initialRoles: Record<string, string> = {};
        requestsData.forEach((req: RegistrationRequest) => {
          initialRoles[req.id] = "STAFF";
        });
        setSelectedRoles(initialRoles);
      } else {
        toast.error("Failed to fetch registration requests");
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      } else {
        toast.error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("An error occurred while loading data");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (requestId: string, role: string) => {
    setSelectedRoles(prev => ({ ...prev, [requestId]: role }));
  };

  const handleApprove = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const role = selectedRoles[requestId] || "STAFF";
      const response = await fetch("/api/admin/approve-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, role }),
      });

      if (response.ok) {
        toast.success("Registration approved successfully!");
        await fetchData();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to approve request");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("An error occurred while approving the request");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const response = await fetch("/api/admin/reject-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      if (response.ok) {
        toast.success("Registration rejected successfully");
        await fetchData();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to reject request");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("An error occurred while rejecting the request");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setActionLoading(userId);
    try {
      const response = await fetch("/api/admin/toggle-user-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: !currentStatus }),
      });

      if (response.ok) {
        toast.success(`User ${!currentStatus ? "activated" : "deactivated"} successfully`);
        await fetchData();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to update user status");
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("An error occurred while updating user status");
    } finally {
      setActionLoading(null);
    }
  };

  const roleOptions = [
    { value: "STAFF", label: "Staff" },
    { value: "ADMIN", label: "Admin" },
  ];

  if (loading) {
    return (
      <ProtectedPage requireRole={["SUPERADMIN"]}>
        <PageLoader />
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage requireRole={["SUPERADMIN"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-2">Manage user accounts and registration requests</p>
          </div>

          {/* Pending Registration Requests */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Pending Registration Requests ({pendingRequests.length})
            </h2>
            {pendingRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending requests</p>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{request.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{request.email}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Requested: {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Select
                          options={roleOptions}
                          value={selectedRoles[request.id] || "STAFF"}
                          onChange={(value) => handleRoleChange(request.id, value)}
                          disabled={actionLoading === request.id}
                        />
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={actionLoading === request.id}
                          className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                        >
                          {actionLoading === request.id ? "Processing..." : "Approve"}
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={actionLoading === request.id}
                          className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                        >
                          {actionLoading === request.id ? "Processing..." : "Reject"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Existing Users */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              All Users ({users.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Joined</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{user.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {user.role !== 'SUPERADMIN' && (
                          <button
                            onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                            disabled={actionLoading === user.id}
                            className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 text-xs"
                          >
                            {actionLoading === user.id ? "..." : user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedPage>
  );
}