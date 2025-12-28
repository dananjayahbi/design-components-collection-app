"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Download,
  Upload,
  Database,
  RefreshCw,
  Trash2,
  HardDrive,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileBox,
} from "lucide-react";

interface BackupStatus {
  exists: boolean;
  fileSize?: number;
  fileSizeFormatted?: string;
  lastModified?: string;
  backupDate?: string;
  version?: string;
  counts?: {
    basicComponents: number;
    reactComponents: number;
    layoutSettings: number;
  };
  message?: string;
}

interface RestoreResult {
  success: boolean;
  message: string;
  restored?: {
    basicComponents: number;
    reactComponents: number;
    layoutSettings: number;
  };
}

export function DataExportTab() {
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isDownloadingBackup, setIsDownloadingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeletingBackup, setIsDeletingBackup] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [clearExistingOnRestore, setClearExistingOnRestore] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch backup status
  const fetchBackupStatus = useCallback(async () => {
    try {
      setIsLoadingStatus(true);
      const response = await fetch("/api/backup/status");
      if (response.ok) {
        const data = await response.json();
        setBackupStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch backup status:", error);
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchBackupStatus();
  }, [fetchBackupStatus]);

  // Create backup
  const handleCreateBackup = async () => {
    try {
      setIsCreatingBackup(true);
      const response = await fetch("/api/backup", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create backup");
      }

      toast.success(
        `Backup created! ${data.stats?.basicComponents || 0} basic, ${data.stats?.reactComponents || 0} react components, ${data.stats?.layoutSettings || 0} layout settings`
      );
      fetchBackupStatus();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create backup"
      );
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Download backup
  const handleDownloadBackup = async () => {
    try {
      setIsDownloadingBackup(true);
      const response = await fetch("/api/backup");

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to download backup");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().split("T")[0]}.db`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Backup downloaded successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to download backup"
      );
    } finally {
      setIsDownloadingBackup(false);
    }
  };

  // Delete backup
  const handleDeleteBackup = async () => {
    try {
      setIsDeletingBackup(true);
      const response = await fetch("/api/backup/status", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete backup");
      }

      toast.success("Backup deleted successfully");
      fetchBackupStatus();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete backup"
      );
    } finally {
      setIsDeletingBackup(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".db")) {
        toast.error("Please select a valid .db backup file");
        return;
      }
      setSelectedFile(file);
    }
  };

  // Restore from backup
  const handleRestore = async () => {
    if (!selectedFile) {
      toast.error("Please select a backup file first");
      return;
    }

    try {
      setIsRestoring(true);
      setShowRestoreConfirm(false);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("clearExisting", String(clearExistingOnRestore));

      const response = await fetch("/api/restore", {
        method: "POST",
        body: formData,
      });

      const data: RestoreResult = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to restore backup");
      }

      toast.success(
        `Restored! ${data.restored?.basicComponents || 0} basic, ${data.restored?.reactComponents || 0} react components, ${data.restored?.layoutSettings || 0} layout settings`
      );

      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      fetchBackupStatus();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to restore backup"
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="space-y-6">
      {/* Backup Status Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-[#5B50E8]" />
            Backup Status
          </h3>
          <button
            onClick={fetchBackupStatus}
            disabled={isLoadingStatus}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh status"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoadingStatus ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {isLoadingStatus ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : backupStatus?.exists ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Backup Available</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <Clock className="w-3 h-3" />
                  Last Backup
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(backupStatus.backupDate || "")}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <HardDrive className="w-3 h-3" />
                  File Size
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {backupStatus.fileSizeFormatted}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <FileBox className="w-3 h-3" />
                  Basic Components
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {backupStatus.counts?.basicComponents || 0}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <FileBox className="w-3 h-3" />
                  React Components
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {backupStatus.counts?.reactComponents || 0}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-600 py-4">
            <AlertTriangle className="w-5 h-5" />
            <span>No backup file found. Create your first backup below.</span>
          </div>
        )}
      </div>

      {/* Create Backup Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-[#5B50E8]" />
          Create Backup
        </h3>

        <p className="text-sm text-gray-600 mb-4">
          Create a SQLite backup file containing all your components and
          settings. This backup can be used to restore your data on any
          localhost instance.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleCreateBackup}
            disabled={isCreatingBackup}
            className="px-4 py-2 bg-[#5B50E8] text-white rounded-lg hover:bg-[#4A3FD7] transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingBackup ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Creating Backup...
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                Create Backup
              </>
            )}
          </button>

          {backupStatus?.exists && (
            <>
              <button
                onClick={handleDownloadBackup}
                disabled={isDownloadingBackup}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloadingBackup ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download Backup
                  </>
                )}
              </button>

              <button
                onClick={handleDeleteBackup}
                disabled={isDeletingBackup}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeletingBackup ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Backup
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Restore Backup Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-[#5B50E8]" />
          Restore from Backup
        </h3>

        <p className="text-sm text-gray-600 mb-4">
          Upload a previously downloaded .db backup file to restore your
          components and settings.
        </p>

        <div className="space-y-4">
          {/* File Input */}
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".db"
              onChange={handleFileSelect}
              className="hidden"
              id="backup-file-input"
            />
            <label
              htmlFor="backup-file-input"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Select Backup File
            </label>
            {selectedFile && (
              <span className="text-sm text-gray-600">
                Selected: <strong>{selectedFile.name}</strong> (
                {(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            )}
          </div>

          {/* Options */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="clear-existing"
              checked={clearExistingOnRestore}
              onChange={(e) => setClearExistingOnRestore(e.target.checked)}
              className="w-4 h-4 text-[#5B50E8] border-gray-300 rounded focus:ring-[#5B50E8]"
            />
            <label
              htmlFor="clear-existing"
              className="text-sm text-gray-700"
            >
              Clear existing data before restore (recommended for clean restore)
            </label>
          </div>

          {/* Restore Button */}
          {selectedFile && !showRestoreConfirm && (
            <button
              onClick={() => setShowRestoreConfirm(true)}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2 text-sm"
            >
              <Upload className="w-4 h-4" />
              Restore from Backup
            </button>
          )}

          {/* Confirm Dialog */}
          {showRestoreConfirm && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-amber-800 mb-1">
                    Confirm Restore
                  </h4>
                  <p className="text-sm text-amber-700 mb-3">
                    {clearExistingOnRestore
                      ? "This will DELETE all existing data and restore from the backup file. This action cannot be undone."
                      : "This will merge the backup data with existing data. Duplicate entries will be updated."}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRestore}
                      disabled={isRestoring}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRestoring ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Restoring...
                        </>
                      ) : (
                        "Yes, Restore"
                      )}
                    </button>
                    <button
                      onClick={() => setShowRestoreConfirm(false)}
                      disabled={isRestoring}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Database className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 mb-1">
              About SQLite Backups
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                • Backups include all Basic Components, React Components, and
                Layout Settings
              </li>
              <li>
                • The backup file (backup.db) is stored in the /backups folder
                of your project
              </li>
              <li>
                • Download the backup file to transfer it to another localhost
                instance
              </li>
              <li>
                • Backups are compatible only with this application
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
