import { DashboardLayout } from '@/components/layout';

export default function BasicComponents() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Basic Components</h1>
        <p className="text-gray-600">This page will be implemented later.</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            💡 Visit <a href="/save-basic-components" className="text-blue-600 underline hover:text-blue-800">Save Basic Components</a> to access the component sandbox.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
