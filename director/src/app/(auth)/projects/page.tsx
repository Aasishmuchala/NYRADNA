'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertModal, ConfirmModal } from '@/components/ui/Modal';

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
  const [selectedFilter, setSelectedFilter] = useState('all');
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
        return 'bg-[#ff7941] text-[#431200]';
      case 'Generating':
        return 'bg-[#00e0ff] text-[#00363f]';
      case 'Drafting':
        return 'bg-[#474746] text-[#525151]';
      case 'Exported':
        return 'bg-[#2c2c2c] text-white';
      default:
        return 'bg-[#474746] text-[#525151]';
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
        <div className="flex flex-wrap items-center gap-2 p-1 bg-[#131313] rounded-xl">
          {['All', 'Drafting', 'Generating', 'Ready', 'Exported'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter.toLowerCase())}
              className={`px-5 py-2 rounded-lg text-sm transition-all ${
                selectedFilter === filter.toLowerCase()
                  ? 'bg-[#262626] text-[#ff9064] font-bold'
                  : 'text-[#adaaaa] hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-[#131313] p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-[#262626] text-[#ff9064]' : 'text-[#adaaaa] hover:text-white'}`}
            >
              <span className="material-symbols-outlined">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-[#262626] text-[#ff9064]' : 'text-[#adaaaa] hover:text-white'}`}
            >
              <span className="material-symbols-outlined">format_list_bulleted</span>
            </button>
          </div>
          <div className="h-8 w-[1px] bg-[#494847]/20"></div>
          <button
            onClick={() => setSortOrder(sortOrder === 'recent' ? 'oldest' : 'recent')}
            className="flex items-center gap-2 text-sm font-medium text-[#adaaaa] hover:text-white transition-colors bg-[#131313] px-4 py-2.5 rounded-lg"
          >
            <span className="material-symbols-outlined text-sm">sort</span>
            Sort: {sortOrder === 'recent' ? 'Last edited' : 'Oldest first'}
          </button>
        </div>
      </div>

      {/* Bulk Actions Banner */}
      {selectedProjects.length > 0 && (
        <div className="flex items-center justify-between px-6 py-3 bg-[#201f1f]/70 backdrop-blur-md rounded-2xl border border-[#494847]/10 shadow-2xl">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSelectAll}
              className="w-5 h-5 border-2 border-[#ff9064] rounded flex items-center justify-center bg-[#ff9064] hover:opacity-80 transition-opacity"
            >
              <span className="material-symbols-outlined text-[#571a00] text-xs" style={{ fontVariationSettings: "'wght' 700" }}>check</span>
            </button>
            <span className="text-sm font-medium">{selectedProjects.length} Project{selectedProjects.length !== 1 ? 's' : ''} selected</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleBulkAction('Duplicate')}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#adaaaa] hover:text-white transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">content_copy</span>
              Duplicate
            </button>
            <button
              onClick={() => handleBulkAction('Export')}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#adaaaa] hover:text-white transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">ios_share</span>
              Export
            </button>
            <button
              onClick={() => handleBulkAction('Delete')}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#ff716c] hover:text-[#d7383b] transition-colors flex items-center gap-2"
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
            className={`group relative flex ${viewMode === 'list' ? 'flex-row items-center' : 'flex-col'} bg-[#131313] rounded-xl overflow-hidden hover:translate-y-[-4px] transition-all duration-300 shadow-lg hover:shadow-[#ff9064]/5`}
          >
            {/* Selection Checkbox */}
            <div className={`${viewMode === 'grid' ? 'absolute top-3 left-3' : 'px-4'} z-10`}>
              <button
                onClick={() => toggleProjectSelection(project.id)}
                className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                  selectedProjects.includes(project.id)
                    ? 'bg-[#ff9064] border-[#ff9064]'
                    : 'border-[#494847] hover:border-[#ff9064]'
                }`}
              >
                {selectedProjects.includes(project.id) && (
                  <span className="material-symbols-outlined text-[#571a00] text-xs" style={{ fontVariationSettings: "'wght' 700" }}>
                    check
                  </span>
                )}
              </button>
            </div>

            <div className={`relative ${viewMode === 'grid' ? 'aspect-video overflow-hidden w-full' : 'aspect-video overflow-hidden w-32 h-32 flex-shrink-0'} ${project.isGenerating ? 'bg-[#262626]' : ''}`}>
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
                  <div className="w-12 h-12 rounded-full border-2 border-[#81e9ff]/30 border-t-[#81e9ff] flex items-center justify-center animate-spin">
                    <span className="material-symbols-outlined text-[#81e9ff]">cycle</span>
                  </div>
                </div>
              )}
              {project.duration && (
                <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[10px] font-medium text-white/90">
                  <span className="material-symbols-outlined text-sm">schedule</span> {project.duration}
                </div>
              )}
            </div>

            <div className={`${viewMode === 'grid' ? 'p-5 space-y-3 w-full' : 'flex-1 p-4 space-y-2'}`}>
              <div className="flex justify-between items-start">
                <h3 className={`font-bold ${viewMode === 'grid' ? 'text-lg' : 'text-base'} leading-tight line-clamp-1 transition-colors ${project.isGenerating ? 'group-hover:text-[#81e9ff]' : 'group-hover:text-[#ff9064]'}`}>
                  {project.title}
                </h3>
                <button
                  onClick={() => setOpenMenuId(openMenuId === project.id ? null : project.id)}
                  className="text-[#adaaaa] hover:text-white relative"
                >
                  <span className="material-symbols-outlined">more_vert</span>
                  {openMenuId === project.id && (
                    <div className="absolute right-0 top-full mt-1 bg-[#262626] border border-[#494847] rounded-lg shadow-lg z-50 min-w-[150px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAlertModal({ open: true, title: 'Open Project', message: `Opening ${project.title}` });
                          setOpenMenuId(null);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-[#adaaaa] hover:text-white hover:bg-[#1a1a1a] transition-colors"
                      >
                        Open
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAlertModal({ open: true, title: 'Duplicate Project', message: `Duplicating ${project.title}` });
                          setOpenMenuId(null);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-[#adaaaa] hover:text-white hover:bg-[#1a1a1a] transition-colors"
                      >
                        Duplicate
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ open: true, title: project.title });
                          setOpenMenuId(null);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-[#ff716c] hover:text-[#d7383b] hover:bg-[#1a1a1a] transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </button>
              </div>
              <div className={`flex ${viewMode === 'grid' ? 'justify-between' : 'gap-4'} items-center text-xs text-[#adaaaa] font-label`}>
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
        <Link href="/create/intent">
          <button className="group relative flex flex-col items-center justify-center bg-[#131313] border-2 border-dashed border-[#494847]/30 rounded-xl aspect-video hover:bg-[#262626] transition-all duration-300 w-full h-full">
            <div className="w-12 h-12 rounded-full bg-[#262626] flex items-center justify-center text-[#ff9064] group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">add</span>
            </div>
            <span className="mt-4 text-sm font-bold uppercase tracking-widest text-[#adaaaa] group-hover:text-[#ff9064] transition-colors">Create New Project</span>
          </button>
        </Link>
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
    </div>
  );
}
