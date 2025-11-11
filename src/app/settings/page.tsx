import { DashboardLayout } from '@/components/layout';
import { SettingsContent } from './components/SettingsContent';

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your AI models and application settings.</p>
        </div>
        <SettingsContent />
      </div>
    </DashboardLayout>
  );
}