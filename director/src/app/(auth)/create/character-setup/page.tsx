'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';
import { CheckCircle2, AlertCircle, Plus } from 'lucide-react';

export default function CharacterSetupPage() {
  const [activeTab, setActiveTab] = useState('real');
  const [selectedGender, setSelectedGender] = useState('male');
  const [characterName, setCharacterName] = useState('Detective Elias');
  const [selectedImages, setSelectedImages] = useState(new Set([0, 1]));
  const [flaggedImages, setFlaggedImages] = useState(new Set([2]));
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [aiDescription, setAiDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <main className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Create your Auteur</h2>
          <p className="text-gray-400 text-sm mt-1">Set up your character&apos;s basic information and training parameters</p>
        </div>
        <div className="flex items-center gap-2 bg-[#262626] px-4 py-2 rounded-lg border border-[#ff9064]/40">
          <div className="w-2 h-2 bg-[#ff9064] rounded-full animate-pulse" />
          <span className="text-sm text-[#ff9064] font-medium">Training in Progress</span>
          <span className="text-xs text-gray-500">45%</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-[#333333]">
        <button
          onClick={() => setActiveTab('real')}
          className={`px-4 py-3 border-b-2 font-medium transition ${
            activeTab === 'real'
              ? 'border-[#ff9064] text-white'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Real person
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-3 border-b-2 font-medium transition ${
            activeTab === 'ai'
              ? 'border-[#ff9064] text-white'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          AI character
        </button>
      </div>

      {/* Real Person Tab */}
      {activeTab === 'real' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Upload Zone */}
          <div className="lg:col-span-1 space-y-4">
            {/* Upload Area */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  const newImages = Array.from(e.target.files).map(file =>
                    URL.createObjectURL(file)
                  );
                  setUploadedImages([...uploadedImages, ...newImages]);
                }
              }}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#333333] rounded-lg p-8 text-center hover:border-[#ff9064]/50 transition cursor-pointer bg-[#0f0f0f]/50"
            >
              <div className="space-y-2">
                <div className="text-3xl">📸</div>
                <p className="text-sm text-gray-400">Drag and drop images here</p>
                <p className="text-xs text-gray-500">or click to select from computer</p>
                <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 10MB. Min 5 images recommended</p>
              </div>
            </div>

            {/* Thumbnails Grid */}
            <div className="grid grid-cols-3 gap-3">
              {[
                'https://lh3.googleusercontent.com/aida-public/AB6AXuCYRoj4ybBzmDSiNhIxYC07ufb6uOZcUi6Iqv8U6V7Mr0b9ao5ApwYsN1iSjcew3Bs5yFeZ38-KIwg2_tihixPXjAU9u8qT0ZjcJfyylaWKMpjaANPQnxaA2FKX0OtcE8lRwuxtUmIY8Kna_7QqgS2SL20-VRNlEJQvcxe_6TYYtxWjF-hrh8NrGYyfALfes1o9he91jDeIAjO1t18SZTjOYfpIWszL6wvEe7iREp3f1JZd6dJssjdK4_cz8YlAj5kVrUIgKU9RbB0',
                'https://lh3.googleusercontent.com/aida-public/AB6AXuDKATpCswz2I0fpetAEf3AxKggHrhhHWf97nJbOpwsDb_jrY6NczuYTu4KucPIUjqVK8ba4b7pLDxkCmvAdsdqkJetuB8RJS7FKX7PPxDIDTqV60nbdHF_TVDCRWK6x12P6hTQcMjWiooQZI590x78L6aPpbVjdkK4aJb2qB93kc9xdB_qLCCUnRGAOQWNZXo_S2EkQlQV5D7QZgL7xYAJhNnTXHrO8D0plyl14it0PdkgyFGQpzyDeWbMpK2cCBjIXO9KhMmBnYKQ',
                'https://lh3.googleusercontent.com/aida-public/AB6AXuAn2ROx5CpGBJGXcxyiZnAPyfcJRhIGEPM1-RcclRcSP9b7cvIBSx64wfJkov9rGC1igLY9v4PsG1sKvvop36JrNlXPjZeM8-qAceoPvClS8Ok37_-BRFkKu9staGfEABL15YszmJdbKyPv6vQgLT1odhk7pj1eghgsQxCFLJIKPsVPUuWrtsZMU23ySguqxGUPJ3O0Q4dvTvLGoVCkDuqK7N37YDuUPUUD9HybkCJyl5nqNHXCTg62VOgV-wPCUCyOmRMQWUQwRto',
                ...uploadedImages
              ].map((src, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (flaggedImages.has(idx)) {
                      setFlaggedImages(new Set([...flaggedImages].filter(i => i !== idx)));
                    } else if (selectedImages.has(idx)) {
                      setSelectedImages(new Set([...selectedImages].filter(i => i !== idx)));
                    } else {
                      setSelectedImages(new Set([...selectedImages, idx]));
                    }
                  }}
                  className="relative aspect-square rounded-lg overflow-hidden border border-[#333333] bg-[#262626] hover:border-[#ff9064]/50 transition"
                >
                  <img
                    src={src}
                    alt={`Thumbnail ${idx + 1}`}
                    className={flaggedImages.has(idx) ? 'w-full h-full object-cover opacity-60' : 'w-full h-full object-cover'}
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    {flaggedImages.has(idx) ? (
                      <div className="flex flex-col items-center">
                        <AlertCircle className="w-6 h-6 text-orange-400 mb-1" />
                        <span className="text-xs text-orange-400 font-medium">BLURRY</span>
                      </div>
                    ) : selectedImages.has(idx) ? (
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    ) : null}
                  </div>
                </button>
              ))}

              {/* Empty Placeholders */}
              {[1, 2, 3].map((n) => (
                <button
                  key={`empty-${n}`}
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-[#333333] bg-[#0f0f0f]/50 flex items-center justify-center cursor-pointer hover:border-[#ff9064]/50 transition"
                >
                  <Plus className="w-6 h-6 text-gray-600" />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Character Metadata Form & Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Character Metadata Card */}
            <div className="bg-[#262626] rounded-lg border border-[#333333] p-6 space-y-4">
              <h3 className="text-lg font-semibold">Character Metadata</h3>

              {/* Name Input */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Character Name</label>
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#333333] rounded-lg text-white placeholder-gray-500 focus:border-[#ff9064] outline-none transition"
                />
              </div>

              {/* Gender Selection */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Gender</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setSelectedGender('male')}
                    className={`py-3 px-4 rounded-lg font-medium transition border ${
                      selectedGender === 'male'
                        ? 'bg-[#ff9064]/10 border-[#ff9064]/40 text-white'
                        : 'bg-[#1a1a1a] border-[#333333] text-gray-400 hover:text-white'
                    }`}
                  >
                    Male
                  </button>
                  <button
                    onClick={() => setSelectedGender('female')}
                    className={`py-3 px-4 rounded-lg font-medium transition border ${
                      selectedGender === 'female'
                        ? 'bg-[#ff9064]/10 border-[#ff9064]/40 text-white'
                        : 'bg-[#1a1a1a] border-[#333333] text-gray-400 hover:text-white'
                    }`}
                  >
                    Female
                  </button>
                  <button
                    onClick={() => setSelectedGender('other')}
                    className={`py-3 px-4 rounded-lg font-medium transition border ${
                      selectedGender === 'other'
                        ? 'bg-[#ff9064]/10 border-[#ff9064]/40 text-white'
                        : 'bg-[#1a1a1a] border-[#333333] text-gray-400 hover:text-white'
                    }`}
                  >
                    Other
                  </button>
                </div>
              </div>
            </div>

            {/* Training Info Card */}
            <div className="bg-gradient-to-br from-[#ff9064]/20 to-[#ff6b6b]/20 border border-[#ff9064]/40 rounded-lg p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Ready to Train?</h3>
                <p className="text-sm text-gray-400 mt-1">Your character setup is ready for training. This will fine-tune the model on your selected images.</p>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#ff9064]">500</span>
                <span className="text-gray-400">Credits required</span>
              </div>

              <button
                onClick={() => alert('Training started! This will use 500 credits.')}
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-[#ff9064] to-[#ff6b6b] text-white font-medium hover:opacity-90 transition"
              >
                Train Character
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Character Tab */}
      {activeTab === 'ai' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#262626] rounded-lg border border-[#333333] p-6 space-y-4">
              <h3 className="text-lg font-semibold">Generate with AI</h3>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Character Description</label>
                <textarea
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder="Describe your character... (e.g., A mysterious detective with piercing blue eyes, aged 40s)"
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333333] rounded-lg text-white placeholder-gray-500 focus:border-[#ff9064] outline-none transition resize-none h-32"
                />
              </div>
              <button className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-[#ff9064] to-[#ff6b6b] text-white font-medium hover:opacity-90 transition">
                ✨ Generate Character
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center gap-4 pt-8 border-t border-[#333333]">
        <Link href="/create/style-dna" className="px-8 py-3 rounded-xl bg-surface-container-highest text-white font-headline font-bold transition-all hover:scale-105 active:scale-95">
          Back
        </Link>
        <Link href="/create/review" className="px-10 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-headline font-black transition-all hover:scale-105 active:scale-95">
          CONTINUE
        </Link>
      </div>
    </main>
  );
}
