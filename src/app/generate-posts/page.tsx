import { DashboardLayout } from '@/components/layout';

export default function GeneratePostsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Generate Posts</h1>
        <p className="text-gray-600">Create and manage your social media posts.</p>
      </div>
    </DashboardLayout>
  );
}