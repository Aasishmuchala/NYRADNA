'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertModal, ConfirmModal } from '@/components/ui/Modal';
import { listProjects, deleteProject, loadProject } from '@/lib/projectStorage';
import type { ProjectIndexEntry } from '@/lib/projectStorage';
import { useWizard } from '@/context/WizardContext';

function resolveLastStep(state: ReturnType<typeof loadProject>): string {
  if (!state) return '/create/intent';
  if (state.videoResults.length > 0) return '/create/export';
  if (state.scenes.length > 0) return '/create/generating';
  if (state.selectedScene && state.selectedScene !== 'scene-01') return '/create/review';
  if (state.characterName || state.aiDescription) return '/create/character-setup';
  if (state.colorIndex !== 0 || state.pacing !== 'balanced') return '/create/style-dna';
  if (state.selectedPersona !== null) return '/create/brief';
  if (state.visionText) return '/create/brief';
  return '/create/intent';
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return iso; }
}

const PROJECT_TYPES = [
  { id: 'commercial', label: 'Commercial / Ad', icon: 'campaign', description: 'Product ad, brand film, or promotional content' },
  { id: 'short-film', label: 'Short Film', icon: 'movie', description: 'Narrative short with characters and story arc' },
  { id: 'music-video', label: 'Music Video', icon: 'music_note', description: 'Visual storytelling synced to a track' },
  { id: 'social', label: 'Social Content', icon: 'share', description: 'Reels, TikToks, or YouTube shorts' },
  { id: 'explainer', label: 'Explainer / Demo', icon: 'school', description: 'Product walkthrough or educational content' },
  { id: 'other', label: 'Other', icon: 'auto_awesome', description: 'Something completely different' },
] as const;

export default function DashboardPage() {
  const router = useRouter();
  const { state, loadFromProject, reset, resetWithoutSave, update } = useWizard();
  const [projects, setProjects] = useState<ProjectIndexEntry[]>([]);
  const [alertModal, setAlertModal] = useState({ open: false, title: '', message: '' });
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: string; title: string }>({ open: false, id: '', title: '' });
  // New project modal removed — lives on /projects page now

  const refreshProjects = useCallback(() => { setProjects(listProjects()); }, []);
  useEffect(() => { document.title = 'Dashboard — DIRECTOR'; }, []);
  useEffect(() => { refreshProjects(); }, [refreshProjects]);

  // No auto-popup — new project modal lives on /projects

  const handleContinue = (id: string) => {
    const s = loadProject(id);
    if (!s) { setAlertModal({ open: true, title: 'Error', message: 'Could not load this project.' }); return; }
    loadFromProject(id);
    router.push(resolveLastStep(s));
  };

  const handleDeleteConfirm = () => {
    try {
      const currentProjectId = `proj-${state.baseSeed}`;
      deleteProject(confirmDelete.id);
      if (currentProjectId === confirmDelete.id) resetWithoutSave();
    } catch (err) { console.error('[Dashboard] Delete failed:', err); }
    setConfirmDelete({ open: false, id: '', title: '' });
    refreshProjects();
  };

  // handleNewProject and handleCreateProject removed — lives on /projects page

  function getClipInfo(id: string): string {
    const s = loadProject(id);
    if (!s) return '';
    const scenes = s.scenes?.length ?? 0;
    const videos = s.videoResults?.length ?? 0;
    const p: string[] = [];
    if (scenes > 0) p.push(`${scenes} scene${scenes !== 1 ? 's' : ''}`);
    if (videos > 0) p.push(`${videos} clip${videos !== 1 ? 's' : ''}`);
    return p.length > 0 ? p.join(' · ') : 'No clips yet';
  }

  return (
    <main className="max-w-7xl mx-auto">
      {/* Welcome */}
      <section className="mb-32">
        <h1 className="font-headline font-light text-6xl md:text-7xl tracking-[-0.03em] leading-tight text-on-surface">
          Welcome back to <br />
          <span className="text-primary/70 font-extralight italic">the center stage.</span>
        </h1>
        <p className="mt-8 text-on-surface-variant/70 font-body text-lg max-w-lg leading-relaxed font-normal tracking-wide">
          Your workspace is synchronized. Neural cores are idle and ready for your next sequence.
        </p>
      </section>

      {/* Engine Status Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-32">
        <div className="glass-card p-10 rounded-xl hover:bg-surface-container transition-all duration-700 group border-outline-variant/30">
          <span className="material-symbols-outlined text-4xl text-primary/50 mb-8 block group-hover:text-primary transition-colors">movie_filter</span>
          <h4 className="text-[10px] tracking-[0.3em] font-bold uppercase text-on-surface-variant/80 mb-2">Projects</h4>
          <p className="text-2xl font-headline font-light text-on-surface">{projects.length} Sequences</p>
        </div>
        <div className="glass-card p-10 rounded-xl hover:bg-surface-container transition-all duration-700 group border-primary/40">
          <span className="material-symbols-outlined text-4xl text-primary/50 mb-8 block group-hover:text-primary transition-colors">memory</span>
          <h4 className="text-[10px] tracking-[0.3em] font-bold uppercase text-on-surface-variant/80 mb-2">Engine Status</h4>
          <p className="text-2xl font-headline font-light text-on-surface">Ready</p>
        </div>
        <div className="glass-card p-10 rounded-xl hover:bg-surface-container transition-all duration-700 group border-outline-variant/30">
          <span className="material-symbols-outlined text-4xl text-primary/50 mb-8 block group-hover:text-primary transition-colors">bolt</span>
          <h4 className="text-[10px] tracking-[0.3em] font-bold uppercase text-on-surface-variant/80 mb-2">Performance</h4>
          <p className="text-2xl font-headline font-light text-on-surface">Optimal</p>
        </div>
      </section>

      {/* Recent Archives */}
      <section className="mb-32">
        <div className="flex justify-between items-center mb-16 px-4">
          <h2 className="text-[10px] tracking-[0.5em] uppercase font-bold text-on-surface-variant">Recent Archives</h2>
          <div className="h-[1px] flex-1 mx-12 bg-surface-container-high"></div>
          <Link href="/projects" className="text-[10px] tracking-[0.2em] uppercase text-primary/80 hover:text-primary font-bold transition-colors">
            New Sequence
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/20 mb-6">auto_videocam</span>
            <p className="text-sm text-on-surface-variant/60 tracking-widest uppercase">No sequences in archive</p>
            <p className="text-xs text-on-surface-variant/30 mt-2">Create your first project to begin</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project, i) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-8 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all duration-500 group border border-outline-variant/20 hover:border-outline-variant/40 cursor-pointer"
                onClick={() => handleContinue(project.id)}
              >
                <div className="flex items-center gap-12">
                  <span className="text-[10px] font-mono text-on-surface-variant/60">{String(i + 1).padStart(3, '0')}</span>
                  <div className="w-24 h-14 rounded overflow-hidden bg-surface-container-highest border border-outline-variant/20">
                    {project.thumbnailUrl ? (
                      <img src={project.thumbnailUrl} alt={project.title} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-transparent" />
                    )}
                  </div>
                  <div>
                    <h5 className="text-sm tracking-widest text-on-surface group-hover:text-on-surface transition-colors uppercase font-headline font-semibold">
                      {project.title}
                    </h5>
                    <p className="text-[9px] tracking-widest text-on-surface-variant/60 mt-1 uppercase">
                      {getClipInfo(project.id)} • {formatDate(project.updatedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-8 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); handleContinue(project.id); }} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface cursor-pointer transition-colors">play_arrow</button>
                  <button onClick={(e) => { e.stopPropagation(); setConfirmDelete({ open: true, id: project.id, title: project.title }); }} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface cursor-pointer transition-colors">delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FAB */}
      <div className="fixed bottom-12 right-12 z-50">
        <Link
          href="/projects"
          className="flex items-center bg-primary text-on-primary-fixed px-8 py-4 rounded-full shadow-[0_20px_50px_rgba(198,191,255,0.3)] hover:scale-105 active:scale-95 transition-all duration-500 group border border-outline-variant/30"
        >
          <span className="material-symbols-outlined mr-3 group-hover:rotate-90 transition-transform duration-500 font-bold">add</span>
          <span className="text-[10px] tracking-[0.3em] font-bold uppercase">New Sequence</span>
        </Link>
      </div>

      {/* Modals */}
      <AlertModal open={alertModal.open} onClose={() => setAlertModal({ ...alertModal, open: false })} title={alertModal.title} message={alertModal.message} />
      <ConfirmModal open={confirmDelete.open} onClose={() => setConfirmDelete({ ...confirmDelete, open: false })} onConfirm={handleDeleteConfirm} title="Delete Project" message={`Are you sure you want to delete "${confirmDelete.title}"? This cannot be undone.`} confirmLabel="Delete" danger />
    </main>
  );
}
