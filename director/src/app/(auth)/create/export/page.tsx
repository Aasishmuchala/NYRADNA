'use client';
import { CachedImg } from '@/components/ui/CachedImg';

import Link from 'next/link';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useWizard } from '@/context/WizardContext';
import { AlertModal } from '@/components/ui/Modal';
import { SOUNDTRACKS } from '@/lib/soundtracks';
import { useVoiceover } from '@/hooks/useVoiceover';
import { useStitching } from '@/hooks/useStitching';
import { useHealth } from '@/hooks/useHealth';

const openExternal = (url: string) => {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.click();
};

export default function ExportPage() {
  useEffect(() => {
    document.title = 'Export — DIRECTOR';
  }, []);

  const { state, update } = useWizard();
  const voiceover = useVoiceover();
  const stitching = useStitching();
  const health = useHealth();

  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ title: '', message: '' });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Sequential preview player state
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const filmTitle = state.visionText ? state.visionText.slice(0, 40).toUpperCase() : 'UNTITLED FILM';
  const safeFilmName = (state.visionText || 'director-film').replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').slice(0, 30);

  const completedVideos = state.videoResults.filter(v => v.status === 'completed' && v.videoUrl);
  const completedScenes = state.scenes.filter(s => s.status === 'completed' && s.imageUrl);

  // Check API health on mount
  useEffect(() => {
    health.check();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sequential preview — auto-advance to next clip when current ends
  const handleClipEnded = useCallback(() => {
    if (currentClipIndex < completedVideos.length - 1) {
      setCurrentClipIndex((prev) => prev + 1);
    }
  }, [currentClipIndex, completedVideos.length]);

  // Auto-play when clip changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentClipIndex]);

  // Priority: stitched film > pipeline final video > individual clips
  const previewVideoUrl = stitching.filmUrl ?? state.finalVideoUrl ?? completedVideos[currentClipIndex]?.videoUrl ?? null;

  const handleDownloadAll = async () => {
    const urls = [
      ...completedScenes.map((s, i) => ({ url: s.imageUrl!, name: `scene-${i + 1}.png` })),
      ...completedVideos.map((v, i) => ({ url: v.videoUrl!, name: `video-${i + 1}.mp4` })),
    ];

    if (urls.length === 0) return;

    if (urls.length === 1) {
      const a = document.createElement('a');
      a.href = urls[0].url;
      a.download = urls[0].name;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
      setAlertMsg({ title: 'Download Started', message: 'Your asset is being downloaded.' });
      setShowAlert(true);
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const total = urls.length;

      for (let i = 0; i < total; i++) {
        const res = await fetch(urls[i].url);
        const blob = await res.blob();
        zip.file(urls[i].name, blob);
        setExportProgress(Math.round(((i + 1) / total) * 80));
      }

      setExportProgress(90);
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      setExportProgress(100);

      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${safeFilmName}.zip`;
      a.click();
      URL.revokeObjectURL(downloadUrl);

      setAlertMsg({ title: 'Download Started', message: 'Your assets are being downloaded. Check your browser\'s download manager.' });
      setShowAlert(true);
    } catch {
      setAlertMsg({ title: 'Export Error', message: 'Failed to bundle assets for download.' });
      setShowAlert(true);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleStitchFilm = async () => {
    const result = await stitching.stitch({ autoContinuity: true });
    if (result) {
      stitching.download(`${safeFilmName}-film.${state.exportFormat}`);
      const { gapsDetected, gapsFixed } = result.continuity;
      const continuityMsg = gapsDetected > 0
        ? `\n\nContinuity: ${gapsFixed}/${gapsDetected} frame mismatches were automatically fixed with AI-generated bridge clips.`
        : '\n\nAll clip transitions have seamless frame continuity.';
      setAlertMsg({ title: 'Film Ready', message: `Your stitched film has been downloaded.${continuityMsg}` });
      setShowAlert(true);
    } else if (stitching.error) {
      setAlertMsg({ title: 'Stitching Error', message: stitching.error });
      setShowAlert(true);
    }
  };

  const handleGenerateVoiceover = async () => {
    const result = await voiceover.generate();
    if (!result && voiceover.error) {
      setAlertMsg({ title: 'Voiceover Error', message: voiceover.error });
      setShowAlert(true);
    }
  };

  return (
    <main className="pt-6 pb-12 max-w-[1440px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* API Health Warning */}
      {health.status && !health.isReady && (
        <div className="col-span-full p-4 rounded-xl bg-error-container border border-error/30 flex items-center gap-3">
          <span className="material-symbols-outlined text-error">warning</span>
          <div>
            <p className="text-sm font-bold text-error">API Connection Issue</p>
            <p className="text-xs text-on-surface-variant mt-1">{health.issues.join('. ')}</p>
          </div>
        </div>
      )}

      {/* Main Content Area: Video Preview */}
      <section className="lg:col-span-8 space-y-6">
        <div className="relative group aspect-video rounded-xl overflow-hidden bg-black shadow-2xl border border-outline-variant/10">
          {previewVideoUrl ? (
            <video
              ref={videoRef}
              src={previewVideoUrl}
              className="w-full h-full object-cover"
              controls
              autoPlay
              onEnded={handleClipEnded}
            />
          ) : (
            <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
              <div className="text-center">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant/20">movie</span>
                <p className="text-on-surface-variant/40 text-sm mt-2">No videos generated yet</p>
              </div>
            </div>
          )}
          {/* Clip indicator — only show when playing individual clips (not stitched) */}
          {!stitching.filmUrl && !state.finalVideoUrl && completedVideos.length > 1 && (
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-full px-4 py-2">
              <button
                onClick={() => setCurrentClipIndex(Math.max(0, currentClipIndex - 1))}
                disabled={currentClipIndex === 0}
                className="text-on-surface/70 hover:text-on-surface disabled:text-on-surface/30 text-sm"
              >
                Prev
              </button>
              <span className="text-xs text-on-surface/90 font-mono px-2">
                Clip {currentClipIndex + 1} / {completedVideos.length}
              </span>
              <button
                onClick={() => setCurrentClipIndex(Math.min(completedVideos.length - 1, currentClipIndex + 1))}
                disabled={currentClipIndex >= completedVideos.length - 1}
                className="text-on-surface/70 hover:text-on-surface disabled:text-on-surface/30 text-sm"
              >
                Next
              </button>
            </div>
          )}
          {(stitching.filmUrl || state.finalVideoUrl) && (
            <div className="absolute top-4 left-4 bg-success/90 text-on-surface text-xs font-bold px-3 py-1 rounded-full">
              {stitching.filmUrl ? 'STITCHED FILM' : 'PIPELINE OUTPUT'}
            </div>
          )}
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-headline font-light tracking-[-0.03em] text-on-surface">{filmTitle}</h1>
            <p className="text-on-surface-variant mt-1">Generated by Director AI Engine</p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-full bg-primary-container/20 text-primary text-xs font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              {completedVideos.length > 0 ? 'READY TO EXPORT' : 'NO ASSETS YET'}
            </span>
          </div>
        </div>

        {/* Generated Assets Gallery */}
        {(completedScenes.length > 0 || completedVideos.length > 0) && (
          <div className="space-y-4">
            <h3 className="text-sm font-headline font-bold uppercase tracking-widest text-on-surface-variant">Generated Assets</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {completedScenes.map((scene) => (
                <a
                  key={scene.id}
                  href={scene.imageUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-video rounded-lg overflow-hidden border border-outline-variant hover:border-primary/50 transition"
                >
                  <CachedImg src={scene.imageUrl!} alt={scene.prompt} className="w-full h-full object-cover" />
                </a>
              ))}
              {completedVideos.map((video) => (
                <div key={video.id} className="aspect-video rounded-lg overflow-hidden border border-outline-variant">
                  <video src={video.videoUrl!} className="w-full h-full object-cover" controls preload="metadata" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export Configuration Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/10 space-y-4">
            <h3 className="text-sm font-headline font-bold uppercase tracking-widest text-on-surface-variant">Output Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Format</label>
                <select
                  value={state.exportFormat}
                  onChange={(e) => update({ exportFormat: e.target.value })}
                  className="bg-surface-container-highest border-none rounded-lg text-sm px-4 py-2 focus:ring-1 focus:ring-primary/50 text-on-surface"
                >
                  <option value="mp4">MP4 (H.264)</option>
                  <option value="mov">MOV (ProRes)</option>
                  <option value="webm">WebM</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Resolution</label>
                <div className="flex items-center gap-2">
                  <div className="flex p-1 bg-surface-container-highest rounded-lg">
                    <button
                      onClick={() => update({ exportResolution: '1080p' })}
                      className={`px-4 py-1 text-xs font-bold rounded-md transition ${
                        state.exportResolution === '1080p'
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      1080p
                    </button>
                    <button
                      onClick={() => update({ exportResolution: '4k' })}
                      className={`px-4 py-1 text-xs font-bold rounded-md transition ${
                        state.exportResolution === '4k'
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      4K
                    </button>
                  </div>
                  <span className="text-[10px] text-on-surface-variant/50 bg-surface-container px-2 py-0.5 rounded">Soon</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/10 space-y-4">
            <h3 className="text-sm font-headline font-bold uppercase tracking-widest text-on-surface-variant">Audio & Text</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between opacity-50">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">subtitles</span>
                  <span className="text-sm font-medium">Burn-in Subtitles</span>
                  <span className="text-[10px] text-on-surface-variant/50 bg-surface-container px-2 py-0.5 rounded">Soon</span>
                </div>
                <input
                  checked={false}
                  disabled
                  className="w-10 h-5 bg-surface-container-highest rounded-full border-none text-primary focus:ring-0 cursor-not-allowed"
                  type="checkbox"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">graphic_eq</span>
                  <span className="text-sm font-medium">Generate Audio</span>
                </div>
                <input
                  checked={state.includeAudio}
                  onChange={(e) => update({ includeAudio: e.target.checked })}
                  className="w-10 h-5 bg-surface-container-highest rounded-full border-none text-primary focus:ring-0 cursor-pointer"
                  type="checkbox"
                />
              </div>
            </div>
          </div>

          {/* Soundtrack Selector */}
          <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/10 space-y-4">
            <h3 className="text-sm font-headline font-bold uppercase tracking-widest text-on-surface-variant">Soundtrack</h3>
            <div className="space-y-2">
              {SOUNDTRACKS.map((track) => (
                <label
                  key={track.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                    state.selectedSoundtrack === track.id
                      ? 'bg-primary/10 border border-primary/30'
                      : 'bg-surface-container-highest/50 border border-transparent hover:border-outline-variant/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="soundtrack"
                    value={track.id}
                    checked={state.selectedSoundtrack === track.id}
                    onChange={() => update({ selectedSoundtrack: track.id })}
                    className="w-4 h-4 text-primary bg-surface-container-highest border-outline-variant focus:ring-primary/50 focus:ring-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-on-surface">{track.name}</span>
                      {track.mood && (
                        <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant/60 bg-surface-container-highest px-1.5 py-0.5 rounded">
                          {track.mood}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant/70 mt-0.5">{track.description}</p>
                  </div>
                  {track.id !== 'none' && (
                    <span className="material-symbols-outlined text-on-surface-variant/40 text-lg">music_note</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Voiceover Section */}
          <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/10 space-y-4">
            <h3 className="text-sm font-headline font-bold uppercase tracking-widest text-on-surface-variant">Voiceover Narration</h3>
            <textarea
              value={state.voiceoverScript}
              onChange={(e) => update({ voiceoverScript: e.target.value })}
              placeholder="Write your narration script here... The AI will generate a voiceover from this text."
              rows={4}
              className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg text-sm px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 resize-none"
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-on-surface-variant/60">
                {state.voiceoverScript.trim().split(/\s+/).filter(Boolean).length} words
              </span>
              <button
                onClick={handleGenerateVoiceover}
                disabled={!state.voiceoverScript.trim() || voiceover.isGenerating}
                className="px-4 py-2 rounded-lg bg-tertiary/90 text-on-tertiary text-xs font-bold uppercase tracking-wider hover:bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {voiceover.isGenerating ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    Generating...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">record_voice_over</span>
                    Generate Voiceover
                  </>
                )}
              </button>
            </div>
            {voiceover.error && (
              <p className="text-xs text-error">{voiceover.error}</p>
            )}
            {voiceover.voiceoverUrl && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-success text-sm">check_circle</span>
                  <span className="text-xs text-success font-bold">Voiceover Ready</span>
                </div>
                <audio
                  src={voiceover.voiceoverUrl}
                  controls
                  className="w-full h-8 rounded-lg"
                  preload="metadata"
                />
                <button
                  onClick={voiceover.clear}
                  className="text-xs text-on-surface-variant/60 hover:text-error transition-colors"
                >
                  Remove voiceover
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Sidebar: Export & Upsell */}
      <aside className="lg:col-span-4 space-y-6">
        {/* Pro Upsell Card */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-tertiary-container/10 to-surface-container border border-tertiary/20 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/10 rounded-full blur-3xl group-hover:bg-tertiary/20 transition-all"></div>
          <div className="flex items-start gap-4 relative z-10">
            <div className="bg-tertiary-container p-2 rounded-lg">
              <span className="material-symbols-outlined text-on-tertiary-container" style={{fontVariationSettings: "'FILL' 1"}}>workspace_premium</span>
            </div>
            <div>
              <h4 className="font-headline font-light tracking-[-0.03em] text-on-surface">Go Pro for Clean Film</h4>
              <p className="text-sm text-on-surface-variant mt-1">Remove the Director AI watermark and unlock 8K exporting.</p>
              <button className="mt-4 text-xs font-bold text-tertiary hover:underline uppercase tracking-widest flex items-center gap-1">
                Upgrade Now
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* Export Final Action */}
        <div className="p-6 rounded-xl bg-surface-container-high border border-outline-variant/10 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              <span>Assets Ready</span>
              <span>{completedVideos.length} videos, {completedScenes.length} images</span>
            </div>
          </div>
          {isExporting && (
            <div className="space-y-1">
              <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-primary-container transition-all duration-300" style={{ width: `${exportProgress}%` }} />
              </div>
              <p className="text-xs text-on-surface-variant text-center">Bundling assets... {exportProgress}%</p>
            </div>
          )}
          {/* Large file warning */}
          {stitching.largeFileWarning && stitching.status === 'idle' && (
            <div className="p-3 rounded-lg bg-tertiary-container/20 border border-tertiary/20 text-xs text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-sm">warning</span>
              <span>Estimated output is large ({stitching.estimatedDuration}). Stitching may take several minutes.</span>
            </div>
          )}
          {/* Estimated duration */}
          {stitching.estimatedClips > 0 && stitching.status === 'idle' && (
            <p className="text-[10px] text-on-surface-variant/50 text-center">
              {stitching.estimatedClips} clips &middot; ~{stitching.estimatedDuration} estimated
            </p>
          )}
          {/* Stitch progress */}
          {stitching.status !== 'idle' && stitching.status !== 'done' && stitching.status !== 'error' && (
            <div className="space-y-2">
              <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                {stitching.progress?.percent != null ? (
                  <div
                    className="h-full bg-gradient-to-r from-tertiary to-tertiary-container transition-all duration-300"
                    style={{ width: `${stitching.progress.percent}%` }}
                  />
                ) : (
                  <div className={`h-full animate-pulse w-full ${
                    stitching.status === 'analyzing' || stitching.status === 'fixing'
                      ? 'bg-gradient-to-r from-processing to-processing-dim'
                      : 'bg-gradient-to-r from-tertiary to-tertiary-container'
                  }`} />
                )}
              </div>
              <p className="text-xs text-on-surface-variant text-center">{stitching.statusMessage}</p>
              {(stitching.status === 'analyzing' || stitching.status === 'fixing') && (
                <p className="text-[10px] text-on-surface-variant/50 text-center">
                  AI is checking frame-by-frame continuity and generating bridge clips where needed
                </p>
              )}
              <button
                onClick={() => stitching.abort()}
                className="text-xs text-error/70 hover:text-error transition-colors mx-auto block"
              >
                Cancel
              </button>
            </div>
          )}
          {/* Continuity report after completion */}
          {stitching.continuity && stitching.status === 'done' && (
            <div className={`p-3 rounded-lg text-xs ${
              stitching.continuity.gapsDetected === 0
                ? 'bg-success-container text-success'
                : stitching.continuity.gapsFixed === stitching.continuity.gapsDetected
                  ? 'bg-success-container text-success'
                  : 'bg-processing-container text-processing'
            }`}>
              {stitching.continuity.gapsDetected === 0
                ? 'All clip transitions have seamless frame continuity'
                : `${stitching.continuity.gapsFixed}/${stitching.continuity.gapsDetected} continuity gaps auto-fixed with AI bridge clips`}
            </div>
          )}
          {/* Stitch into single film */}
          <button
            onClick={handleStitchFilm}
            disabled={!stitching.canStitch || (stitching.status !== 'idle' && stitching.status !== 'done' && stitching.status !== 'error')}
            className="w-full bg-gradient-to-br from-tertiary to-tertiary-container py-4 rounded-xl text-on-tertiary-fixed font-headline font-black text-lg shadow-lg hover:shadow-tertiary/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined">movie_edit</span>
            {stitching.status === 'analyzing' ? 'CHECKING CONTINUITY...'
              : stitching.status === 'fixing' ? 'GENERATING BRIDGE CLIPS...'
              : stitching.status === 'stitching' || stitching.status === 'downloading' ? 'STITCHING FILM...'
              : stitching.status === 'grading' || stitching.status === 'mixing' ? 'FINALIZING...'
              : 'STITCH & EXPORT FILM'}
          </button>

          {/* Direct download for pipeline output (single video) */}
          {state.finalVideoUrl && !stitching.filmUrl && (
            <a
              href={state.finalVideoUrl}
              download={`${safeFilmName}-pipeline.${state.exportFormat}`}
              className="w-full bg-gradient-to-br from-primary to-primary-container py-4 rounded-xl text-on-primary font-headline font-black text-lg shadow-lg hover:shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3 text-center no-underline"
            >
              <span className="material-symbols-outlined">download</span>
              DOWNLOAD PIPELINE OUTPUT
            </a>
          )}

          {/* Download individual assets */}
          <button
            onClick={handleDownloadAll}
            disabled={(completedVideos.length === 0 && completedScenes.length === 0) || isExporting}
            className="w-full bg-gradient-to-br from-primary to-primary-container py-4 rounded-xl text-on-primary font-headline font-black text-lg shadow-lg hover:shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined">download</span>
            {isExporting ? 'EXPORTING...' : 'DOWNLOAD ALL AS ZIP'}
          </button>
          <div className="pt-4 border-t border-outline-variant/15">
            <h5 className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter mb-4 text-center">Share Directly</h5>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => navigator.clipboard.writeText(window.location.href).then(() => { setAlertMsg({ title: 'Copied', message: 'Link copied to clipboard.' }); setShowAlert(true); })} className="flex flex-col items-center gap-2 p-3 rounded-lg bg-surface-container-highest hover:bg-surface-bright transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant">link</span>
                <span className="text-[10px] uppercase font-bold text-on-surface-variant">Copy Link</span>
              </button>
              <button onClick={() => openExternal(`https://wa.me/?text=${encodeURIComponent(window.location.href)}`)} className="flex flex-col items-center gap-2 p-3 rounded-lg bg-surface-container-highest hover:bg-surface-bright transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant">chat</span>
                <span className="text-[10px] uppercase font-bold text-on-surface-variant">WhatsApp</span>
              </button>
              <button onClick={() => openExternal('https://instagram.com')} className="flex flex-col items-center gap-2 p-3 rounded-lg bg-surface-container-highest hover:bg-surface-bright transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant">camera</span>
                <span className="text-[10px] uppercase font-bold text-on-surface-variant">Instagram</span>
              </button>
            </div>
          </div>
        </div>

        {/* Metadata Card */}
        <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/10">
          <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Metadata</h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Videos</span>
              <span className="text-on-surface font-mono">{completedVideos.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Scene Images</span>
              <span className="text-on-surface font-mono">{completedScenes.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Est. Duration</span>
              <span className="text-on-surface font-mono">{completedVideos.length * 5}s</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Format</span>
              <span className="text-on-surface font-mono">{state.exportFormat.toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Resolution</span>
              <span className="text-on-surface font-mono">{state.exportResolution}</span>
            </div>
            {voiceover.voiceoverUrl && (
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Voiceover</span>
                <span className="text-success font-mono">Ready</span>
              </div>
            )}
            {state.selectedSoundtrack !== 'none' && (
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Soundtrack</span>
                <span className="text-on-surface font-mono">{SOUNDTRACKS.find(s => s.id === state.selectedSoundtrack)?.name}</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Footer Navigation */}
      <div className="col-span-full border-t border-outline-variant/15 pt-6 flex justify-between items-center gap-4">
        <Link href="/create/generating" className="px-8 py-3 rounded-xl bg-surface-container-highest text-on-surface font-headline font-bold transition-all hover:scale-105 active:scale-95">
          Back
        </Link>
        <Link href="/dashboard" className="px-10 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-headline font-black transition-all hover:scale-105 active:scale-95">
          BACK TO DASHBOARD
        </Link>
      </div>

      <AlertModal
        open={showAlert}
        onClose={() => setShowAlert(false)}
        title={alertMsg.title}
        message={alertMsg.message}
      />
    </main>
  );
}
