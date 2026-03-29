'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Modal, { AlertModal, ConfirmModal } from '@/components/ui/Modal';
import { listProjects, deleteProject, loadProject } from '@/lib/projectStorage';
import type { ProjectIndexEntry } from '@/lib/projectStorage';
import { useWizard } from '@/context/WizardContext';

/** Map wizard state to the furthest step route the user likely reached. */
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
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
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
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: string; title: string }>({
    open: false,
    id: '',
    title: '',
  });

  // New project modal
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectConcept, setNewProjectConcept] = useState('');
  const [newProjectType, setNewProjectType] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const refreshProjects = useCallback(() => {
    setProjects(listProjects());
  }, []);

  useEffect(() => {
    document.title = 'Dashboard — DIRECTOR';
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  // Auto-open new project modal for first-time users (no existing projects)
  const hasAutoOpened = useRef(false);
  useEffect(() => {
    if (!hasAutoOpened.current && projects.length === 0) {
      hasAutoOpened.current = true;
      // Small delay to let the page render first
      setTimeout(() => handleNewProject(), 200);
    }
  }, [projects]);

  const handleContinue = (id: string) => {
    const state = loadProject(id);
    if (!state) {
      setAlertModal({ open: true, title: 'Error', message: 'Could not load this project.' });
      return;
    }
    loadFromProject(id);
    const route = resolveLastStep(state);
    router.push(route);
  };

  const handleDeleteConfirm = () => {
    try {
      // If the currently loaded wizard state is this project, reset it
      const currentProjectId = `proj-${state.baseSeed}`;
      const idToDelete = confirmDelete.id;
      deleteProject(idToDelete);
      if (currentProjectId === idToDelete) {
        resetWithoutSave();
      }
    } catch (err) {
      console.error('[Dashboard] Delete failed:', err);
    }
    setConfirmDelete({ open: false, id: '', title: '' });
    refreshProjects();
  };

  const handleNewProject = () => {
    setNewProjectName('');
    setNewProjectConcept('');
    setNewProjectType('');
    setShowNewProject(true);
    setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    reset();
    // Seed the wizard with project details
    const conceptParts: string[] = [];
    if (newProjectConcept.trim()) conceptParts.push(newProjectConcept.trim());
    const selectedType = PROJECT_TYPES.find(t => t.id === newProjectType);
    if (selectedType) conceptParts.push(`[Format: ${selectedType.label}]`);

    update({ visionText: conceptParts.join('\n\n') || '' });
    setShowNewProject(false);
    router.push('/create/intent');
  };

  /** Get a short summary of clip count from a saved project */
  function getClipInfo(id: string): string {
    const state = loadProject(id);
    if (!state) return '';
    const scenes = state.scenes?.length ?? 0;
    const videos = state.videoResults?.length ?? 0;
    const parts: string[] = [];
    if (scenes > 0) parts.push(`${scenes} scene${scenes !== 1 ? 's' : ''}`);
    if (videos > 0) parts.push(`${videos} clip${videos !== 1 ? 's' : ''}`);
    return parts.length > 0 ? parts.join(' · ') : 'No clips yet';
  }

  return (
    <main className="pt-24 pb-12 pl-4 pr-4 md:pl-72 md:pr-[340px] min-h-screen">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Hero Heading */}
        <section className="space-y-1">
          <h2 className="text-3xl md:text-4xl font-extrabold headline-font tracking-tighter">Continue where you left off</h2>
          <p className="text-on-surface-variant text-sm">Your recent masterpieces are ready for the next cut.</p>
        </section>

        {/* Projects Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {projects.length === 0 ? (
            /* Empty state */
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4">movie</span>
              <h3 className="text-lg font-bold mb-2">No recent projects</h3>
              <p className="text-on-surface-variant text-sm">Start a new project to see it here.</p>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="group relative rounded-xl border border-outline-variant/20 bg-surface-container hover:bg-surface-container-high transition-colors overflow-hidden"
              >
                {/* Thumbnail */}
                {project.thumbnailUrl ? (
                  <img
                    src={project.thumbnailUrl}
                    alt={project.title}
                    className="w-full aspect-video object-cover"
                  />
                ) : (
                  <div className="w-full aspect-video bg-gradient-to-br from-primary/20 via-surface-container-highest to-primary-container/30" />
                )}

                <div className="p-6 space-y-3">
                  {/* Title */}
                  <h3 className="text-lg font-bold headline-font truncate">{project.title}</h3>

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {formatDate(project.updatedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">movie</span>
                      {getClipInfo(project.id)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleContinue(project.id)}
                      aria-label={`Continue ${project.title}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <span className="material-symbols-outlined text-sm">play_arrow</span>
                      Continue
                    </button>
                    <button
                      onClick={() =>
                        setConfirmDelete({ open: true, id: project.id, title: project.title })
                      }
                      aria-label={`Delete ${project.title}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant/30 text-sm text-on-surface-variant hover:bg-error/10 hover:text-error hover:border-error/30 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-error/30"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>

        {/* New Project Action */}
        <section>
          <button
            onClick={handleNewProject}
            aria-label="Start new project"
            className="w-full h-48 rounded-xl border-2 border-dashed border-outline-variant/30 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-4 transition-all group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <div className="w-16 h-16 rounded-full bg-surface-container-highest group-hover:bg-primary group-hover:text-on-primary flex items-center justify-center transition-all duration-300">
              <span className="material-symbols-outlined text-3xl" data-icon="add_circle">add_circle</span>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold headline-font">Start New Project</p>
              <p className="text-sm text-on-surface-variant">Empty canvas for your next AI-generated film</p>
            </div>
          </button>
        </section>
      </div>

      {/* Error / info alert */}
      <AlertModal
        open={alertModal.open}
        onClose={() => setAlertModal({ ...alertModal, open: false })}
        title={alertModal.title}
        message={alertModal.message}
      />

      {/* Delete confirmation */}
      <ConfirmModal
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ ...confirmDelete, open: false })}
        onConfirm={handleDeleteConfirm}
        title="Delete Project"
        message={`Are you sure you want to delete "${confirmDelete.title}"? This will remove all scenes, videos, assets, pipelines, and generation data associated with this project. This cannot be undone.`}
        confirmLabel="Delete"
        danger
      />

      {/* New Project Modal */}
      <Modal
        open={showNewProject}
        onClose={() => setShowNewProject(false)}
        title="New Project"
        wide
        actions={
          <>
            <button
              onClick={() => setShowNewProject(false)}
              className="px-4 py-2 rounded-lg bg-surface-container-highest text-on-surface text-sm font-medium hover:bg-surface-bright transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim()}
              className="px-5 py-2 rounded-lg bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed text-sm font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">movie_filter</span>
              Create Project
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Project Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Project Name</label>
            <input
              ref={nameInputRef}
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
              placeholder="e.g. Nike Summer Campaign"
              className="w-full px-4 py-3 bg-surface-container-highest text-on-surface rounded-lg border border-outline-variant/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors text-sm"
            />
          </div>

          {/* Project Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {PROJECT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setNewProjectType(newProjectType === type.id ? '' : type.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all text-xs border ${
                    newProjectType === type.id
                      ? 'bg-primary/10 border-primary/40 text-white'
                      : 'bg-surface-container-highest border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/40'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[16px] ${newProjectType === type.id ? 'text-primary' : ''}`}>{type.icon}</span>
                  <span className="font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Brief Concept */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Brief Concept <span className="text-on-surface-variant font-normal">(optional)</span></label>
            <textarea
              value={newProjectConcept}
              onChange={(e) => setNewProjectConcept(e.target.value)}
              placeholder="Describe your vision in a few sentences... The AI Director will develop it further."
              rows={3}
              className="w-full px-4 py-3 bg-surface-container-highest text-on-surface rounded-lg border border-outline-variant/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors text-sm resize-none"
            />
          </div>
        </div>
      </Modal>
    </main>
  );
}
