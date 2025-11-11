"use client";

import { Select } from '@/components/ui';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Sparkles, Copy, Check, Save } from 'lucide-react';

interface TextModel {
  id: string;
  name: string;
  modelId: string;
  isDefault: boolean;
  isActive: boolean;
}

const TONE_OPTIONS = [
  { value: "motivational", label: "Motivational" },
  { value: "professional", label: "Professional" },
  { value: "inspirational", label: "Inspirational" },
  { value: "humorous", label: "Humorous" },
  { value: "thoughtful", label: "Thoughtful" },
];

const LENGTH_OPTIONS = [
  { value: "short", label: "Short (1-2 lines)" },
  { value: "medium", label: "Medium (3-4 lines)" },
  { value: "long", label: "Long (5-6 lines)" },
];

export function QuotesGenerator() {
  const [textModels, setTextModels] = useState<TextModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedTone, setSelectedTone] = useState("motivational");
  const [selectedLength, setSelectedLength] = useState("medium");
  const [niche, setNiche] = useState("");
  const [customContext, setCustomContext] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuote, setGeneratedQuote] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchTextModels();
  }, []);

  const fetchTextModels = async () => {
    try {
      const response = await fetch('/api/settings/text-models');
      const data = await response.json();
      
      if (data.models && data.models.length > 0) {
        setTextModels(data.models);
        
        // Set default model
        const defaultModel = data.models.find((m: TextModel) => m.isDefault && m.isActive);
        if (defaultModel) {
          setSelectedModel(defaultModel.modelId);
        } else {
          // If no default, use first active model
          const firstActive = data.models.find((m: TextModel) => m.isActive);
          if (firstActive) {
            setSelectedModel(firstActive.modelId);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching text models:', error);
      toast.error('Failed to load text models');
    }
  };

  const handleGenerateQuote = async () => {
    setIsGenerating(true);
    setGeneratedQuote('');
    setCopied(false);
    setSaved(false);

    try {
      const response = await fetch('/api/generate/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          model: selectedModel,
          tone: selectedTone,
          length: selectedLength,
          niche: niche || undefined,
          context: customContext || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to generate quote');
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        toast.error('Failed to read response');
        return;
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        setGeneratedQuote(prev => prev + chunk);
      }

      toast.success('Quote generated successfully!');
    } catch (error) {
      console.error('Error generating quote:', error);
      toast.error('An error occurred while generating quote');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyQuote = () => {
    navigator.clipboard.writeText(generatedQuote);
    setCopied(true);
    toast.success('Quote copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveQuote = async () => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/save/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote: generatedQuote,
          tone: selectedTone,
          length: selectedLength,
          niche: niche || undefined,
          context: customContext || undefined,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to save quote');
        return;
      }

      setSaved(true);
      toast.success('Quote saved to CSV successfully!');
    } catch (error) {
      console.error('Error saving quote:', error);
      toast.error('An error occurred while saving quote');
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
              options={textModels.filter(m => m.isActive).map(m => ({
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
              Tone <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <Select
              options={TONE_OPTIONS}
              value={selectedTone}
              onChange={(value) => setSelectedTone(value)}
              disabled={isGenerating}
              fullWidth
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Length <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <Select
              options={LENGTH_OPTIONS}
              value={selectedLength}
              onChange={(value) => setSelectedLength(value)}
              disabled={isGenerating}
              fullWidth
            />
          </div>

          <div>
            <label htmlFor="niche" className="block text-sm font-medium text-gray-700 mb-2">
              Niche/Topic <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              id="niche"
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              disabled={isGenerating}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5B50E8] focus:border-transparent outline-none transition-all disabled:opacity-50 text-sm"
              placeholder="e.g., business, fitness, life..."
            />
          </div>

          <div>
            <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-2">
              Custom Context <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <textarea
              id="context"
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
              disabled={isGenerating}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5B50E8] focus:border-transparent outline-none transition-all disabled:opacity-50 text-sm resize-none"
              placeholder="Add any specific theme or context..."
            />
          </div>

          <button
            onClick={handleGenerateQuote}
            disabled={isGenerating}
            className="w-full px-6 py-3 bg-[#5B50E8] text-white font-medium rounded-lg hover:bg-[#4A3FD7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Sparkles className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Generate Quote'}
          </button>
        </div>
      </div>

      {/* Output */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Generated Quote</h2>
          {generatedQuote && !isGenerating && (
            <div className="flex gap-2">
              <button
                onClick={handleCopyQuote}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleSaveQuote}
                disabled={isSaving || saved}
                className="px-3 py-2 bg-[#5B50E8] text-white rounded-lg hover:bg-[#4A3FD7] transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? 'Saved!' : isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        <div className="min-h-[200px] flex items-center justify-center">
          {isGenerating && (
            <div className="text-center">
              <div className="w-12 h-12 animate-spin rounded-full border-4 border-gray-300 border-t-[#5B50E8] mx-auto mb-4"></div>
              <p className="text-gray-600">Generating your quote...</p>
            </div>
          )}

          {!isGenerating && !generatedQuote && (
            <p className="text-gray-500 text-center">
              Click "Generate Quote" to create a unique motivational quote
            </p>
          )}

          {!isGenerating && generatedQuote && (
            <div className="w-full">
              <div className="bg-linear-to-br from-[#5B50E8]/10 to-purple-50 p-6 rounded-lg border-l-4 border-[#5B50E8]">
                <p className="text-lg text-gray-900 italic leading-relaxed">
                  "{generatedQuote}"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
