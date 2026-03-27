'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, AlertCircle, Plus, Search, Bell, HelpCircle } from 'lucide-react';

export default function CharacterSetupPage() {
  const [selectedGender, setSelectedGender] = useState('male');
  const [characterName, setCharacterName] = useState('Detective Elias');

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-[#1f1f1f] border-r border-[#333333] flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[#333333]">
          <div className="text-xl font-bold">DIRECTOR</div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#262626]"
          >
            <div className="w-5 h-5 bg-gray-600 rounded" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/projects"
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#262626]"
          >
            <div className="w-5 h-5 bg-gray-600 rounded" />
            <span>Projects</span>
          </Link>

          <Link
            href="/characters"
            className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[#262626] text-[#ff9064]"
          >
            <div className="w-5 h-5 bg-[#ff9064] rounded" />
            <span>Characters</span>
          </Link>

          <Link
            href="/datasets"
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#262626]"
          >
            <div className="w-5 h-5 bg-gray-600 rounded" />
            <span>Datasets</span>
          </Link>

          <Link
            href="/models"
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#262626]"
          >
            <div className="w-5 h-5 bg-gray-600 rounded" />
            <span>Models</span>
          </Link>
        </nav>

        {/* New Project Button */}
        <div className="p-4 border-t border-[#333333] space-y-3">
          <button className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-[#ff9064] to-[#ff6b6b] text-white font-medium hover:opacity-90 transition">
            + New Project
          </button>

          <Link
            href="/help"
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#262626] text-sm"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Help &amp; Support</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="md:ml-64">
        {/* Sticky Header */}
        <header className="sticky top-0 z-40 bg-[#1a1a1a] border-b border-[#333333] px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold">CHARACTER SETUP</h1>

            <div className="flex items-center gap-4 ml-auto">
              {/* Search */}
              <div className="relative hidden lg:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 bg-[#262626] rounded-lg text-sm text-white placeholder-gray-500 border border-[#333333] focus:border-[#ff9064] outline-none"
                />
              </div>

              {/* Notifications */}
              <button className="p-2 hover:bg-[#262626] rounded-lg transition">
                <Bell className="w-5 h-5 text-gray-400" />
              </button>

              {/* Help */}
              <button className="p-2 hover:bg-[#262626] rounded-lg transition">
                <HelpCircle className="w-5 h-5 text-gray-400" />
              </button>

              {/* User Avatar */}
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBM5NvPekv4bJC3N4-GQG6A7U0yYLl6u17lMW75IHixpdevVnooW0cpnK-4mrj9bs7KauAGe3j9VosfzL04Ezin942D4OCERHmS3Jx0vt2-rMSRGYeOQyaFKi-HounZ1hNcyUUKWbk5Enub2vW10l0dZSFkNRSHCoVIQP870roiH70Vs-Hs3jNm5LhvH-5krhJaHjLXyW1v0cEnuyABeihvSKm6XiRlw1J4Fh6eAiOzwikBDvCZYfqtTnKrvjDMM_-g88Q6qYrwclA"
                alt="User Avatar"
                className="w-8 h-8 rounded-full"
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
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
            <button className="px-4 py-3 border-b-2 border-[#ff9064] text-white font-medium">
              Real person
            </button>
            <button className="px-4 py-3 border-b-2 border-transparent text-gray-400 hover:text-white font-medium">
              AI character
            </button>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Upload Zone */}
            <div className="lg:col-span-1 space-y-4">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-[#333333] rounded-lg p-8 text-center hover:border-[#ff9064]/50 transition cursor-pointer bg-[#0f0f0f]/50">
                <div className="space-y-2">
                  <div className="text-3xl">📸</div>
                  <p className="text-sm text-gray-400">Drag and drop images here</p>
                  <p className="text-xs text-gray-500">or click to select from computer</p>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 10MB. Min 5 images recommended</p>
                </div>
              </div>

              {/* Thumbnails Grid */}
              <div className="grid grid-cols-3 gap-3">
                {/* Success 1 */}
                <div className="relative aspect-square rounded-lg overflow-hidden border border-[#333333] bg-[#262626]">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYRoj4ybBzmDSiNhIxYC07ufb6uOZcUi6Iqv8U6V7Mr0b9ao5ApwYsN1iSjcew3Bs5yFeZ38-KIwg2_tihixPXjAU9u8qT0ZjcJfyylaWKMpjaANPQnxaA2FKX0OtcE8lRwuxtUmIY8Kna_7QqgS2SL20-VRNlEJQvcxe_6TYYtxWjF-hrh8NrGYyfALfes1o9he91jDeIAjO1t18SZTjOYfpIWszL6wvEe7iREp3f1JZd6dJssjdK4_cz8YlAj5kVrUIgKU9RbB0"
                    alt="Upload thumbnail 1"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  </div>
                </div>

                {/* Success 2 */}
                <div className="relative aspect-square rounded-lg overflow-hidden border border-[#333333] bg-[#262626]">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKATpCswz2I0fpetAEf3AxKggHrhhHWf97nJbOpwsDb_jrY6NczuYTu4KucPIUjqVK8ba4b7pLDxkCmvAdsdqkJetuB8RJS7FKX7PPxDIDTqV60nbdHF_TVDCRWK6x12P6hTQcMjWiooQZI590x78L6aPpbVjdkK4aJb2qB93kc9xdB_qLCCUnRGAOQWNZXo_S2EkQlQV5D7QZgL7xYAJhNnTXHrO8D0plyl14it0PdkgyFGQpzyDeWbMpK2cCBjIXO9KhMmBnYKQ"
                    alt="Upload thumbnail 2"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  </div>
                </div>

                {/* Error: Blurry */}
                <div className="relative aspect-square rounded-lg overflow-hidden border border-[#333333] bg-[#262626]">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAn2ROx5CpGBJGXcxyiZnAPyfcJRhIGEPM1-RcclRcSP9b7cvIBSx64wfJkov9rGC1igLY9v4PsG1sKvvop36JrNlXPjZeM8-qAceoPvClS8Ok37_-BRFkKu9staGfEABL15YszmJdbKyPv6vQgLT1odhk7pj1eghgsQxCFLJIKPsVPUuWrtsZMU23ySguqxGUPJ3O0Q4dvTvLGoVCkDuqK7N37YDuUPUUD9HybkCJyl5nqNHXCTg62VOgV-wPCUCyOmRMQWUQwRto"
                    alt="Upload thumbnail 3"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-400 mb-1" />
                    <span className="text-xs text-red-400 font-medium">BLURRY</span>
                  </div>
                </div>

                {/* Empty Placeholder 1 */}
                <div className="aspect-square rounded-lg border-2 border-dashed border-[#333333] bg-[#0f0f0f]/50 flex items-center justify-center cursor-pointer hover:border-[#ff9064]/50 transition">
                  <Plus className="w-6 h-6 text-gray-600" />
                </div>

                {/* Empty Placeholder 2 */}
                <div className="aspect-square rounded-lg border-2 border-dashed border-[#333333] bg-[#0f0f0f]/50 flex items-center justify-center cursor-pointer hover:border-[#ff9064]/50 transition">
                  <Plus className="w-6 h-6 text-gray-600" />
                </div>

                {/* Empty Placeholder 3 */}
                <div className="aspect-square rounded-lg border-2 border-dashed border-[#333333] bg-[#0f0f0f]/50 flex items-center justify-center cursor-pointer hover:border-[#ff9064]/50 transition">
                  <Plus className="w-6 h-6 text-gray-600" />
                </div>
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

                <button className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-[#ff9064] to-[#ff6b6b] text-white font-medium hover:opacity-90 transition">
                  Train Character
                </button>
              </div>

              {/* AI Generation Sandbox - Disabled */}
              <div className="opacity-50 pointer-events-none">
                <div className="bg-[#262626] rounded-lg border border-[#333333] p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">AI Generation Sandbox</h3>
                    <span className="text-xs px-2 py-1 bg-[#333333] text-gray-400 rounded">Drafting Mode</span>
                  </div>

                  <p className="text-sm text-gray-400">Generate sample dialogue and content in drafting mode to test your character&apos;s voice before full deployment.</p>

                  <div className="space-y-3">
                    <textarea
                      placeholder="Enter a scenario or prompt..."
                      className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#333333] rounded-lg text-white placeholder-gray-500 focus:border-[#ff9064] outline-none transition resize-none h-24"
                      disabled
                    />

                    <button className="w-full py-2 px-4 rounded-lg bg-[#1a1a1a] border border-[#333333] text-gray-400 font-medium">
                      Generate Sample
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-[#333333] px-6 py-8 mt-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>&copy; 2024 DIRECTOR. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/terms" className="hover:text-gray-400 transition">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-gray-400 transition">
                Privacy Policy
              </Link>
              <Link href="https://twitter.com" className="hover:text-gray-400 transition">
                Twitter
              </Link>
              <Link href="https://discord.com" className="hover:text-gray-400 transition">
                Discord
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}