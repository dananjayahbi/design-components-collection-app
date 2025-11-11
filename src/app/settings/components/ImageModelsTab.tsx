"use client";

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Check, Edit2, X } from 'lucide-react';

interface ImageModel {
  id: string;
  name: string;
  modelId: string;
  isDefault: boolean;
  isActive: boolean;
}

export function ImageModelsTab() {
  const [imageModels, setImageModels] = useState<ImageModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [newImageModel, setNewImageModel] = useState({ name: '', modelId: '' });
  const [editingImageModel, setEditingImageModel] = useState<string | null>(null);
  const [editImageForm, setEditImageForm] = useState({ name: '', modelId: '' });

  useEffect(() => {
    fetchImageModels();
  }, []);

  const fetchImageModels = async () => {
    try {
      const response = await fetch('/api/settings/image-models');
      const data = await response.json();
      setImageModels(data.models || []);
    } catch (error) {
      console.error('Error fetching image models:', error);
      toast.error('Failed to load image models');
    } finally {
      setLoading(false);
    }
  };

  const handleAddImageModel = async () => {
    if (!newImageModel.name || !newImageModel.modelId) {
      toast.error('Please enter both name and model ID');
      return;
    }

    try {
      const response = await fetch('/api/settings/image-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newImageModel),
      });

      if (!response.ok) throw new Error();

      toast.success('Image model added successfully');
      setNewImageModel({ name: '', modelId: '' });
      fetchImageModels();
    } catch (error) {
      toast.error('Failed to add image model');
    }
  };

  const handleSetDefaultImage = async (id: string) => {
    try {
      const response = await fetch('/api/settings/image-models', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isDefault: true }),
      });

      if (!response.ok) throw new Error();

      toast.success('Default image model updated');
      fetchImageModels();
    } catch (error) {
      toast.error('Failed to update default model');
    }
  };

  const handleDeleteImageModel = async (id: string) => {
    if (!confirm('Are you sure you want to delete this model?')) return;

    try {
      const response = await fetch(`/api/settings/image-models?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error();

      toast.success('Image model deleted');
      fetchImageModels();
    } catch (error) {
      toast.error('Failed to delete image model');
    }
  };

  const handleEditImageModel = (model: ImageModel) => {
    setEditingImageModel(model.id);
    setEditImageForm({ name: model.name, modelId: model.modelId });
  };

  const handleCancelEditImage = () => {
    setEditingImageModel(null);
    setEditImageForm({ name: '', modelId: '' });
  };

  const handleSaveImageModel = async (id: string) => {
    if (!editImageForm.name || !editImageForm.modelId) {
      toast.error('Both name and model ID are required');
      return;
    }

    try {
      const response = await fetch('/api/settings/image-models', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editImageForm }),
      });

      if (!response.ok) throw new Error();

      toast.success('Image model updated');
      setEditingImageModel(null);
      setEditImageForm({ name: '', modelId: '' });
      fetchImageModels();
    } catch (error) {
      toast.error('Failed to update image model');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#5B50E8]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add new image model */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Image Model</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input
            type="text"
            placeholder="Display Name (e.g., Gemini 2.5 Flash Image)"
            value={newImageModel.name}
            onChange={(e) => setNewImageModel({ ...newImageModel, name: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5B50E8] focus:border-transparent outline-none text-sm"
          />
          <input
            type="text"
            placeholder="Model ID (e.g., gemini-2.5-flash-image)"
            value={newImageModel.modelId}
            onChange={(e) => setNewImageModel({ ...newImageModel, modelId: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5B50E8] focus:border-transparent outline-none text-sm"
          />
        </div>
        <button
          onClick={handleAddImageModel}
          className="px-4 py-2 bg-[#5B50E8] text-white rounded-lg hover:bg-[#4A3FD7] transition-colors flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Image Model
        </button>
      </div>

      {/* List of image models */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configured Models</h3>
        <div className="space-y-2">
          {imageModels.map((model) => (
            <div
              key={model.id}
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              {editingImageModel === model.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={editImageForm.name}
                      onChange={(e) => setEditImageForm({ ...editImageForm, name: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5B50E8] focus:border-transparent outline-none text-sm"
                      placeholder="Display Name"
                    />
                    <input
                      type="text"
                      value={editImageForm.modelId}
                      onChange={(e) => setEditImageForm({ ...editImageForm, modelId: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5B50E8] focus:border-transparent outline-none text-sm"
                      placeholder="Model ID"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveImageModel(model.id)}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEditImage}
                      className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{model.name}</span>
                      {model.isDefault && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Default</span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">{model.modelId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditImageModel(model)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Edit model"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSetDefaultImage(model.id)}
                      disabled={model.isDefault}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Set Default
                    </button>
                    <button
                      onClick={() => handleDeleteImageModel(model.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete model"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
