'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertModal, ConfirmModal } from '@/components/ui/Modal';

interface Character {
  id: string;
  name: string;
  projects: number;
  date: string;
  status: string;
  tag: string;
  loraStatus: string;
  image: string;
}

export default function CharactersPage() {
  useEffect(() => {
    document.title = 'Characters — DIRECTOR';
  }, []);

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'library' | 'training' | 'shared'>('library');
  const [sortOrder, setSortOrder] = useState<'recent' | 'name'>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [characters] = useState<Character[]>([]);
  const [alertModal, setAlertModal] = useState({ open: false, title: '', message: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; name: string }>({ open: false, name: '' });
  const [renameModal, setRenameModal] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });

  let filteredCharacters = characters.filter(char =>
    char.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (sortOrder === 'name') {
    filteredCharacters.sort((a, b) => a.name.localeCompare(b.name));
  }

  const handleRename = (id: string, currentName: string) => {
    setRenameModal({ open: true, id, name: currentName });
  };

  const handleDelete = (name: string) => {
    setDeleteConfirm({ open: true, name });
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

            {filteredCharacters.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4">person_search</span>
                <p className="text-on-surface-variant">No characters found. Create your first character to get started.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <AlertModal
        open={alertModal.open}
        onClose={() => setAlertModal({ ...alertModal, open: false })}
        title={alertModal.title}
        message={alertModal.message}
      />
      <ConfirmModal
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, open: false })}
        onConfirm={() => {
          setAlertModal({ open: true, title: 'Deleted', message: `${deleteConfirm.name} has been deleted.` });
        }}
        title="Delete Character"
        message={`Are you sure you want to delete "${deleteConfirm.name}"?`}
        confirmLabel="Delete"
        danger
      />
      <AlertModal
        open={renameModal.open}
        onClose={() => setRenameModal({ ...renameModal, open: false })}
        title="Rename Character"
        message={`Rename functionality for "${renameModal.name}" will be available when connected to a backend.`}
      />
    </div>
  );
}
