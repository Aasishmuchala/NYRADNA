'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CharactersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'library' | 'training' | 'shared'>('library');
  const [sortOrder, setSortOrder] = useState<'recent' | 'name'>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');

  const characters = [
    { id: '1', name: 'Elias Thorne', projects: 12, date: 'Oct 24, 2024', status: 'active', tag: 'AI Generated', loraStatus: 'LoRA: Active', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6BE7BKdxqMaVFpnCm2WZ7VaAVPyn9TBwYSoHXwYZdB9vge_0ZfOsj7MkM1LkljPyHOVbLtQf_HncAL3_RVk4Jid4IQat4Sw8dBVHldysqgL5IUNiZ-TMl_URWsz5UV5CSobPO2pB7jjVuD-LRRlFiLr2xu7WmgOuSLF0Y-W8nbWoa_i5wQMVajIbxHGE3nYYU-GF2pTPLPQRwMrZK_CMruSuFsMKjAXA64wBweSbX_AsreVNBsmLBbW12NYXGB2x9_IN1Erbirt8' },
    { id: '2', name: 'Sloane Vane', projects: 4, date: 'Nov 02, 2024', status: 'active', tag: 'Real Asset', loraStatus: 'Base Only', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCS3wtfgLtqwiiK_X83C2i421M7panEcHPMGYIYaORQJX9T1npDcstrQIF5dFNG_WZUVnuC7d3h715mhZ8-6snyr9NibI1gx-tI-MA3YFv3Bw0gqI3cGDPxQvJDcMUx9fnSWaD16cTh7r7AsZysetEy-VZ_1S5-l3YJioUCidU5tHA2lmgrXN3GGY8LRLzGc1k-nV05_8FqFz4QfPm_jyUf0BPsNKX_UcHH7G1T1YPA1fKMe-2utJ61k5Zui8dOy1kvn7RwKBF4oBw' },
    { id: '3', name: 'The Captain', projects: 1, date: 'Nov 15, 2024', status: 'active', tag: 'AI Generated', loraStatus: 'LoRA: Ready', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNRNbCaysjVWCY-oVuGz1FHojxSY15sJzb2jyTeg22OFUMwmEAN36u738vJD-RVk3rdACnQAAaeHhLex7_gw4cmPe44hzYa1kX3LwbDi5U25JDSwzIgZd2G3r2r6DHwzEvkWaBzZ1bkhLgPl103zEup2ud91_XSVU351m_xhwdE3tNvvH3ihnov5M1HIaOJWHW-QT31YXxPcVSMhVPqpB1iHqPYRtI-rBx49LhfXFPeo_BfeKLY9XZ6FBR5jC2nVr7_7nMclbduiw' },
    { id: '4', name: 'Nova Prime', projects: 0, date: 'Just Now', status: 'training', tag: 'AI Generated', loraStatus: 'Training...', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPA2AqFvY1NaI3cVmxqOhWr8Ht4unJQw7I7PTD0Wl4lObLVl4cO3OQHHDD9nrc8sej24vY8VuUUpAxg2atf-S1oZXGkfZ-YZMyTPa3bfRmWoJIOHx-ih9GngsFE7VkrSwRf4N3gVD_KUfxu-nkN-e0JUtzFMj61fFPYX03E9mdBAteUXFx0Hy8lEcA7hiSndQ8HCSR9wu2-hpJmMVyMiRglFqvuH6772ZwQyG6D4kwCQCp9l6eYAW2mb3JxBiA9r1ZaZQR35VaRQI' }
  ];

  let filteredCharacters = characters.filter(char =>
    char.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (sortOrder === 'name') {
    filteredCharacters.sort((a, b) => a.name.localeCompare(b.name));
  }

  const handleRename = (id: string, currentName: string) => {
    setRenameId(id);
    setRenameName(currentName);
  };

  const confirmRename = (id: string) => {
    const newName = prompt('Enter new character name:', renameName);
    if (newName && newName.trim()) {
      alert(`Character renamed to "${newName}"`);
    }
    setRenameId(null);
  };

  const handleDelete = (name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      alert(`${name} has been deleted.`);
    }
  };

  const handleUseInProject = (id: string) => {
    router.push('/create/character-setup');
  };

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary selection:text-on-primary">
      {/* Main Content Canvas */}
      <main className="min-h-screen relative">
        {/* Content Area */}
        <div className="p-8 max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="space-y-2">
              <h3 className="text-4xl font-black font-headline tracking-tighter text-on-surface">Digital Cast</h3>
              <p className="text-on-surface-variant max-w-md">Manage your consistent character identities for high-fidelity cinematic generation. Leverage LoRA training for frame-to-frame stability.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSortOrder(sortOrder === 'recent' ? 'name' : 'recent')}
                className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest rounded-lg text-sm font-medium hover:bg-surface-bright transition-colors"
              >
                <span className="material-symbols-outlined text-lg">filter_list</span>
                {sortOrder === 'recent' ? 'Sort by Recent' : 'Sort by Name'}
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary rounded-lg text-on-primary text-sm font-medium hover:bg-primary-container transition-colors">
                <span className="material-symbols-outlined text-lg">grid_view</span>
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="mb-8">
            <input
              type="text"
              placeholder="Search characters by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-surface-container-low text-on-surface placeholder-on-surface-variant rounded-lg border border-outline-variant/30 focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          {/* Character Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Create New Card */}
            <Link href="/create/character-setup">
              <div className="group relative aspect-[4/5] rounded-xl overflow-hidden bg-surface-container-low flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/30 hover:border-primary/50 transition-all cursor-pointer">
                <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-3xl">add</span>
                </div>
                <span className="mt-4 font-headline font-bold text-lg text-on-surface">+ New Character</span>
                <span className="text-xs text-on-surface-variant/60 font-label">Upload or Generate Face</span>
              </div>
            </Link>

            {/* Character Cards */}
            {filteredCharacters.map((character) => (
              <div
                key={character.id}
                className="group relative aspect-[4/5] rounded-xl overflow-hidden bg-surface-container-low transition-all duration-300 hover:-translate-y-2"
                title={character.status === 'training' ? 'Training in progress - character will be available soon' : ''}
              >
                <div className="absolute inset-0 z-0">
                  <img alt={character.name} className="w-full h-full object-cover" src={character.image} />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/20 to-transparent"></div>
                </div>
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider ${
                    character.tag === 'AI Generated'
                      ? 'bg-primary-container text-on-primary-container'
                      : 'bg-surface-bright text-on-surface'
                  }`}>
                    {character.tag}
                  </span>
                  <span className={`px-2 py-1 backdrop-blur-md text-[10px] font-bold uppercase rounded-md tracking-wider flex items-center gap-1 ${
                    character.loraStatus === 'Training...'
                      ? 'bg-surface-container-highest text-on-surface-variant'
                      : character.loraStatus === 'Base Only'
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'bg-tertiary-container/30 text-tertiary'
                  }`}>
                    {character.loraStatus !== 'Training...' && character.loraStatus !== 'Base Only' && (
                      <span className="material-symbols-outlined text-[12px]" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
                    )}
                    {character.loraStatus === 'Training...' && (
                      <span className="material-symbols-outlined text-[12px]">sync</span>
                    )}
                    {character.loraStatus}
                  </span>
                </div>
                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDelete(character.name)}
                    className="bg-surface-container-highest/80 backdrop-blur-md p-2 rounded-lg hover:text-error transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5 z-10 space-y-3">
                  <div>
                    <h4 className="text-xl font-bold font-headline text-white">{character.name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">movie</span>
                        {character.projects} {character.projects === 1 ? 'Project' : 'Projects'}
                      </span>
                      <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        {character.date}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-outline-variant/20 flex gap-2">
                    <button
                      onClick={() => handleRename(character.id, character.name)}
                      className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold py-2 rounded-lg transition-all"
                    >
                      Rename
                    </button>
                    {character.status === 'training' ? (
                      <button className="flex-[2] bg-primary/20 cursor-not-allowed text-primary-dim text-xs font-bold py-2 rounded-lg transition-all">
                        Preparing...
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUseInProject(character.id)}
                        className="flex-[2] bg-primary hover:bg-primary-container text-on-primary text-xs font-bold py-2 rounded-lg transition-all"
                      >
                        Use in Project
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
