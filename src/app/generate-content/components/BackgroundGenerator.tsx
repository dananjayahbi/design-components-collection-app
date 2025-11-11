"use client";

import { Select } from '@/components/ui';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Image as ImageIcon, Sparkles, Save, Check } from 'lucide-react';

interface ImageModel {
  id: string;
  name: string;
  modelId: string;
  isDefault: boolean;
  isActive: boolean;
}

const ASPECT_RATIOS = [
  { value: "1:1", label: "1:1 (Square)" },
  { value: "4:3", label: "4:3 (Fullscreen)" },
  { value: "3:4", label: "3:4 (Portrait Fullscreen)" },
  { value: "9:16", label: "9:16 (Portrait)" },
];

export function BackgroundGenerator() {
  const [imageModels, setImageModels] = useState<ImageModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState("3:4");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchImageModels();
    fetchImageSettings();
  }, []);

  const fetchImageModels = async () => {
    try {
      const response = await fetch('/api/settings/image-models');
      const data = await response.json();
      
      if (data.models && data.models.length > 0) {
        setImageModels(data.models);
        
        // Set default model
        const defaultModel = data.models.find((m: ImageModel) => m.isDefault && m.isActive);
        if (defaultModel) {
          setSelectedModel(defaultModel.modelId);
        } else {
          // If no default, use first active model
          const firstActive = data.models.find((m: ImageModel) => m.isActive);
          if (firstActive) {
            setSelectedModel(firstActive.modelId);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching image models:', error);
      toast.error('Failed to load image models');
    }
  };

  const fetchImageSettings = async () => {
    try {
      const response = await fetch('/api/settings/image-settings');
      const data = await response.json();
      
      if (data.settings && data.settings.defaultAspectRatio) {
        setSelectedAspectRatio(data.settings.defaultAspectRatio);
      }
    } catch (error) {
      console.error('Error fetching image settings:', error);
    }
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setSaved(false);

    try {
      const response = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          prompt: prompt,
          aspectRatio: selectedAspectRatio,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to generate image');
        return;
      }

      const data = await response.json();
      setGeneratedImage(data.imageData);
      toast.success('Image generated successfully!');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('An error occurred while generating image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveImage = async () => {
    if (!generatedImage) {
      toast.error('No image to save');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/save/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: generatedImage,
          prompt: prompt,
          model: selectedModel,
          aspectRatio: selectedAspectRatio,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to save image');
        return;
      }

      setSaved(true);
      toast.success('Image saved successfully!');
    } catch (error) {
      console.error('Error saving image:', error);
      toast.error('An error occurred while saving image');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Model
            </label>
            <Select
              options={imageModels.filter(m => m.isActive).map(m => ({
                value: m.modelId,
                label: m.name
              }))}
              value={selectedModel}
              onChange={(value) => setSelectedModel(value)}
              disabled={isGenerating}
              fullWidth
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aspect Ratio
            </label>
            <Select
              options={ASPECT_RATIOS}
              value={selectedAspectRatio}
              onChange={(value) => setSelectedAspectRatio(value)}
              disabled={isGenerating}
              fullWidth
            />
          </div>

          <div>
            <label htmlFor="image-prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Image Prompt
            </label>
            <textarea
              id="image-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5B50E8] focus:border-transparent outline-none transition-all disabled:opacity-50 text-sm resize-none"
              placeholder="Describe the background image you want to generate..."
            />
          </div>

          <button
            onClick={handleGenerateImage}
            disabled={isGenerating}
            className="w-full px-6 py-3 bg-[#5B50E8] text-white font-medium rounded-lg hover:bg-[#4A3FD7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Sparkles className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Generate Image'}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Generated Image</h2>
          {generatedImage && !isGenerating && (
            <button
              onClick={handleSaveImage}
              disabled={isSaving || saved}
              className="px-3 py-2 bg-[#5B50E8] text-white rounded-lg hover:bg-[#4A3FD7] transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? 'Saved!' : isSaving ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>

        <div className="min-h-[400px] flex items-center justify-center">
          {isGenerating && (
            <div className="text-center">
              <div className="w-12 h-12 animate-spin rounded-full border-4 border-gray-300 border-t-[#5B50E8] mx-auto mb-4"></div>
              <p className="text-gray-600">Generating your image...</p>
            </div>
          )}

          {!isGenerating && !generatedImage && (
            <div className="text-center">
              <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                Enter a prompt and click "Generate Image" to create a background
              </p>
            </div>
          )}

          {!isGenerating && generatedImage && (
            <div className="w-full">
              <img
                src={generatedImage}
                alt="Generated background"
                className="w-full h-auto rounded-lg border border-gray-200"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
