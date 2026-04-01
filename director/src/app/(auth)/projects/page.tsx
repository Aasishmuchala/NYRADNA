'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Modal, { AlertModal, ConfirmModal } from '@/components/ui/Modal';
import { useWizard } from '@/context/WizardContext';

const PROJECT_TYPES = [
  { id: 'commercial', label: 'Commercial / Ad', icon: 'campaign' },
  { id: 'short-film', label: 'Short Film', icon: 'movie' },
  { id: 'music-video', label: 'Music Video', icon: 'music_note' },
  { id: 'social', label: 'Social Content', icon: 'share' },
  { id: 'explainer', label: 'Explainer / Demo', icon: 'school' },
  { id: 'other', label: 'Other', icon: 'auto_awesome' },
] as const;

interface Project {
  id: number;
  title: string;
  badge: string;
  duration: string | null;
  created: string;
  edited: string;
  image: string;
  isGenerating?: boolean;
}

export default function ProjectsPage() {
  const router = useRouter();
  const { reset, update } = useWizard();

  useEffect(() => {
    document.title = 'Projects — DIRECTOR';
  }, []);

  const [selectedFilter, setSelectedFilter] = useState('all');

  // New project modal state
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectConcept, setNewProjectConcept] = useState('');
  const [newProjectType, setNewProjectType] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleNewProject = () => {
    setNewProjectName(''); setNewProjectConcept(''); setNewProjectType('');
    setShowNewProject(true);
    setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    reset();
    const parts: string[] = [];
    if (newProjectConcept.trim()) parts.push(newProjectConcept.trim());
    const st = PROJECT_TYPES.find(t => t.id === newProjectType);
    if (st) parts.push(`[Format: ${st.label}]`);
    update({ visionText: parts.join('\n\n') || '' });
    setShowNewProject(false);
    router.push('/create/intent');
  };
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [projects] = useState<Project[]>([]);
  const [alertModal, setAlertModal] = useState({ open: false, title: '', message: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; title: string }>({ open: false, title: '' });

  const getBadgeClasses = (badge: string) => {
    switch (badge) {
      case 'Ready':
        return 'bg-primary-container text-on-primary-fixed';
      case 'Generating':
        return 'bg-tertiary text-on-primary-fixed';
      case 'Drafting':
        return 'bg-surface-container-highest text-on-surface-variant';
      case 'Exported':
        return 'bg-surface-container-high text-on-surface';
      default:
        return 'bg-surface-container-highest text-on-surface-variant';
    }
  };

  const filteredProjects = projects.filter((project) => {
    if (selectedFilter === 'all') return true;
    return project.badge.toLowerCase() === selectedFilter;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortOrder === 'recent') return b.id - a.id;
    return a.id - b.id;
  });

  const toggleProjectSelection = (projectId: number) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProjects.length === sortedProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(sortedProjects.map((p) => p.id));
    }
  };

  const handleBulkAction = (action: string) => {
    setAlertModal({ open: true, title: 'Bulk Action', message: `Performing ${action} on ${selectedProjects.length} project(s)` });
  };

  return (
    <div className="p-8 max-w-[1600px] w-full mx-auto space-y-8">
      {/* Filter & Action Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex flex-wrap items-center gap-2 p-1 bg-surface-container-low rounded-xl">
          {['All', 'Drafting', 'Generating', 'Ready', 'Exported'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter.toLowerCase())}
              className={`px-5 py-2 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                selectedFilter === filter.toLowerCase()
                  ? 'bg-surface-bright text-primary font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={`p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 ${viewMode === 'grid' ? 'bg-surface-bright text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <span className="material-symbols-outlined">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label="List view"
              className={`p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 ${viewMode === 'list' ? 'bg-surface-bright text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <span className="material-symbols-outlined">format_list_bulleted</span>
            </button>
          </div>
          <div className="h-8 w-[1px] bg-outline-variant/20" aria-hidden="true"></div>
          <button
            onClick={() => setSortOrder(sortOrder === 'recent' ? 'oldest' : 'recent')}
            aria-label={`Sort by ${sortOrder === 'recent' ? 'oldest first' : 'last edited'}`}
            className="flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors bg-surface-container-low px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <span className="material-symbols-outlined text-sm">sort</span>
            Sort: {sortOrder === 'recent' ? 'Last edited' : 'Oldest first'}
          </button>
        </div>
      </div>

      {/* Bulk Actions Banner */}
      {selectedProjects.length > 0 && (
        <div className="flex items-center justify-between px-6 py-3 bg-surface-container/70 backdrop-blur-md rounded-2xl border border-outline-variant/10 shadow-2xl">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSelectAll}
              aria-label="Select all projects"
              className="w-5 h-5 border-2 border-primary rounded flex items-center justify-center bg-primary hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <span className="material-symbols-outlined text-on-primary-fixed text-xs" style={{ fontVariationSettings: "'wght' 700" }}>check</span>
            </button>
            <span className="text-sm font-medium">{selectedProjects.length} Project{selectedProjects.length !== 1 ? 's' : ''} selected</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleBulkAction('Duplicate')}
              aria-label="Duplicate selected projects"
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-lg"
            >
              <span className="material-symbols-outlined text-lg">content_copy</span>
              Duplicate
            </button>
            <button
              onClick={() => handleBulkAction('Export')}
              aria-label="Export selected projects"
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-lg"
            >
              <span className="material-symbols-outlined text-lg">ios_share</span>
              Export
            </button>
            <button
              onClick={() => handleBulkAction('Delete')}
              aria-label="Delete selected projects"
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-error hover:text-error/80 transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-error/30 rounded-lg"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Project Grid/List View */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6' : 'space-y-3'}>
        {sortedProjects.map((project) => (
          <div
            key={project.id}
            className={`group relative flex ${viewMode === 'list' ? 'flex-row items-center' : 'flex-col'} bg-surface-container-low rounded-xl overflow-hidden hover:translate-y-[-4px] transition-all duration-300 shadow-lg hover:shadow-primary/5`}
          >
            {/* Selection Checkbox */}
            <div className={`${viewMode === 'grid' ? 'absolute top-3 left-3' : 'px-4'} z-10`}>
              <button
                onClick={() => toggleProjectSelection(project.id)}
                aria-label={`Select ${project.title}`}
                className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  selectedProjects.includes(project.id)
                    ? 'bg-primary border-primary'
                    : 'border-outline-variant hover:border-primary'
                }`}
              >
                {selectedProjects.includes(project.id) && (
                  <span className="material-symbols-outlined text-on-primary-fixed text-xs" style={{ fontVariationSettings: "'wght' 700" }}>
                    check
                  </span>
                )}
              </button>
            </div>

            <div className={`relative ${viewMode === 'grid' ? 'aspect-video overflow-hidden w-full' : 'aspect-video overflow-hidden w-32 h-32 flex-shrink-0'} ${project.isGenerating ? 'bg-surface-bright' : ''}`}>
              <img
                alt="Thumbnail"
                className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${project.isGenerating ? 'opacity-40' : ''}`}
                src={project.image}
              />
              {!project.isGenerating && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
              )}
              {project.isGenerating && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
              )}
              <div className="absolute top-3 right-3">
                <span className={`${getBadgeClasses(project.badge)} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider`}>
                  {project.badge}
                </span>
              </div>
              {project.isGenerating && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-2 border-tertiary/30 border-t-tertiary flex items-center justify-center animate-spin">
                    <span className="material-symbols-outlined text-tertiary">cycle</span>
                  </div>
                </div>
              )}
              {project.duration && (
                <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[10px] font-medium text-on-surface/90">
                  <span className="material-symbols-outlined text-sm">schedule</span> {project.duration}
                </div>
              )}
            </div>

            <div className={`${viewMode === 'grid' ? 'p-5 space-y-3 w-full' : 'flex-1 p-4 space-y-2'}`}>
              <div className="flex justify-between items-start">
                <h3 className={`font-bold ${viewMode === 'grid' ? 'text-lg' : 'text-base'} leading-tight line-clamp-1 transition-colors ${project.isGenerating ? 'group-hover:text-tertiary' : 'group-hover:text-primary'}`}>
                  {project.title}
                </h3>
                <button
                  onClick={() => setOpenMenuId(openMenuId === project.id ? null : project.id)}
                  aria-label={`More options for ${project.title}`}
                  className="text-on-surface-variant hover:text-on-surface relative focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-lg"
                >
                  <span className="material-symbols-outlined">more_vert</span>
                  {openMenuId === project.id && (
                    <div className="absolute right-0 top-full mt-1 bg-surface-bright border border-outline-variant rounded-lg shadow-lg z-50 min-w-[150px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAlertModal({ open: true, title: 'Open Project', message: `Opening ${project.title}` });
                          setOpenMenuId(null);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors focus:outline-none focus:bg-surface-container"
                      >
                        Open
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAlertModal({ open: true, title: 'Duplicate Project', message: `Duplicating ${project.title}` });
                          setOpenMenuId(null);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors focus:outline-none focus:bg-surface-container"
                      >
                        Duplicate
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ open: true, title: project.title });
                          setOpenMenuId(null);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-error hover:text-error/80 hover:bg-surface-container transition-colors focus:outline-none focus:bg-surface-container"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </button>
              </div>
              <div className={`flex ${viewMode === 'grid' ? 'justify-between' : 'gap-4'} items-center text-xs text-on-surface-variant font-label`}>
                <span>{project.created}</span>
                <span>{project.edited}</span>
              </div>
            </div>
          </div>
        ))}

        {sortedProjects.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4">video_library</span>
            <h3 className="text-lg font-bold mb-2">No projects yet</h3>
            <p className="text-on-surface-variant text-sm mb-6">Create your first AI-generated film to get started.</p>
          </div>
        )}

        {/* Add New Project Ghost Card */}
        <button
          onClick={handleNewProject}
          className="group relative flex flex-col items-center justify-center bg-surface-container-low border-2 border-dashed border-outline-variant/30 rounded-xl aspect-video hover:bg-surface-bright transition-all duration-300 w-full h-full focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          aria-label="Create new project"
        >
          <div className="w-12 h-12 rounded-full bg-surface-bright flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-3xl">add</span>
          </div>
          <span className="mt-4 text-sm font-bold uppercase tracking-widest text-on-surface-variant group-hover:text-primary transition-colors">Create New Project</span>
        </button>
      </div>

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
          // Delete logic would go here
        }}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteConfirm.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
      />

      {/* New Project Modal */}
      <Modal open={showNewProject} onClose={() => setShowNewProject(false)} title="New Sequence" wide actions={
        <>
          <button onClick={() => setShowNewProject(false)} className="px-6 py-3 rounded-full bg-surface-container text-on-surface-variant text-[10px] tracking-[0.2em] uppercase font-bold hover:bg-surface-container-high transition-colors">Cancel</button>
          <button onClick={handleCreateProject} disabled={!newProjectName.trim()} className="px-8 py-3 rounded-full bg-primary text-on-primary-fixed text-[10px] tracking-[0.2em] uppercase font-bold shadow-[0_0_30px_rgba(198,191,255,0.2)] hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100">Create</button>
        </>
      }>
        <div className="space-y-6">
          <div>
            <label className="text-[10px] tracking-[0.3em] font-bold uppercase text-on-surface-variant mb-3 block">Project Name</label>
            <input ref={nameInputRef} type="text" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()} placeholder="e.g. Neural Horizons" className="w-full px-4 py-3 bg-surface-container text-on-surface rounded-lg border border-outline-variant/20 focus:border-primary/50 focus:outline-none transition-colors placeholder-on-surface-variant/40" />
          </div>
          <div>
            <label className="text-[10px] tracking-[0.3em] font-bold uppercase text-on-surface-variant mb-3 block">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {PROJECT_TYPES.map((type) => (
                <button key={type.id} onClick={() => setNewProjectType(newProjectType === type.id ? '' : type.id)} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all text-xs border ${newProjectType === type.id ? 'bg-primary/10 border-primary/40 text-on-surface' : 'bg-surface-container border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/30'}`}>
                  <span className={`material-symbols-outlined text-[16px] ${newProjectType === type.id ? 'text-primary' : ''}`}>{type.icon}</span>
                  <span className="font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] tracking-[0.3em] font-bold uppercase text-on-surface-variant mb-3 block">Brief Concept <span className="text-on-surface-variant/40 font-normal">(optional)</span></label>
            <textarea value={newProjectConcept} onChange={(e) => setNewProjectConcept(e.target.value)} placeholder="Describe your vision..." rows={3} className="w-full px-4 py-3 bg-surface-container text-on-surface rounded-lg border border-outline-variant/20 focus:border-primary/50 focus:outline-none transition-colors placeholder-on-surface-variant/40 resize-none" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
