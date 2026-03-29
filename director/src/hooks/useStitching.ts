'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useWizard } from '@/context/WizardContext';
import { getSoundtrack } from '@/lib/soundtracks';
import { buildReferenceImageSet } from '@/lib/subjectRefs';

export type StitchStatus =
  | 'idle'
  | 'downloading'
  | 'analyzing'
  | 'fixing'
  | 'stitching'
  | 'grading'
  | 'mixing'
  | 'done'
  | 'error';

interface ContinuityReport {
  gapsDetected: number;
  gapsFixed: number;
}

interface StitchResult {
  filmUrl: string;
  blob: Blob;
  continuity: ContinuityReport;
}

interface DownloadProgress {
  receivedBytes: number;
  totalBytes: number | null;
  percent: number | null;
}

/** Estimated size per clip in bytes (~10 MB). */
const ESTIMATED_BYTES_PER_CLIP = 10 * 1024 * 1024;

/** Threshold above which we warn the user about large file size. */
const LARGE_FILE_WARNING_BYTES = 500 * 1024 * 1024;

export function useStitching() {
  const { state } = useWizard();
  const [status, setStatus] = useState<StitchStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [filmUrl, setFilmUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [continuity, setContinuity] = useState<ContinuityReport | null>(null);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [largeFileWarning, setLargeFileWarning] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Revoke blob URL and abort in-progress operations on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Track filmUrl for cleanup — revoke when component unmounts
  const filmUrlRef = useRef<string | null>(null);
  useEffect(() => {
    filmUrlRef.current = filmUrl;
    return () => {
      if (filmUrlRef.current) {
        URL.revokeObjectURL(filmUrlRef.current);
      }
    };
  }, [filmUrl]);

  // Deduplicate videos by URL — multi-prompt batches share one video across
  // multiple scene entries. Stitching the same file N times would be wrong.
  const completedVideos = state.videoResults
    .filter((v) => v.status === 'completed' && v.videoUrl)
    .filter((v, i, arr) => arr.findIndex((x) => x.videoUrl === v.videoUrl) === i);

  /** Estimated total clips including potential bridge clips. */
  const estimatedClips = completedVideos.length;

  /** Rough estimated duration formatted as a readable string. */
  const estimatedDurationSec = estimatedClips * 5;
  const estimatedDuration =
    estimatedDurationSec >= 60
      ? `${Math.floor(estimatedDurationSec / 60)}m ${estimatedDurationSec % 60}s`
      : `${estimatedDurationSec}s`;

  /**
   * Stream a Response body into a Blob while reporting progress.
   * Falls back to res.blob() if ReadableStream is unavailable.
   */
  async function streamToBlob(
    res: Response,
    signal: AbortSignal,
    onProgress: (p: DownloadProgress) => void,
  ): Promise<Blob> {
    const contentLength = res.headers.get('Content-Length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : null;

    // If the browser doesn't expose a readable body, fall back to .blob()
    if (!res.body) {
      const blob = await res.blob();
      onProgress({
        receivedBytes: blob.size,
        totalBytes: blob.size,
        percent: 100,
      });
      return blob;
    }

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;

    try {
      for (;;) {
        if (signal.aborted) {
          reader.cancel();
          throw new DOMException('Aborted', 'AbortError');
        }

        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedBytes += value.length;

        const percent =
          totalBytes && totalBytes > 0
            ? Math.round((receivedBytes / totalBytes) * 100)
            : null;

        onProgress({ receivedBytes, totalBytes, percent });
      }
    } catch (err) {
      reader.cancel();
      throw err;
    }

    const contentType = res.headers.get('Content-Type') ?? 'video/mp4';
    return new Blob(chunks as BlobPart[], { type: contentType });
  }

  const stitch = useCallback(
    async (
      options?: {
        autoContinuity?: boolean;
        maxBridgeClips?: number;
      },
    ): Promise<StitchResult | null> => {
      // Dynamic maxBridgeClips: 10% of clips, minimum 5
      const dynamicMax = Math.max(5, Math.ceil(completedVideos.length * 0.1));

      const {
        autoContinuity = true,
        maxBridgeClips = dynamicMax,
      } = options ?? {};

      if (completedVideos.length < 2) {
        setError('Need at least 2 completed videos to stitch');
        return null;
      }

      // Abort previous operation if still running
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setStatus('downloading');
      setStatusMessage('Preparing clips...');
      setError(null);
      setContinuity(null);
      setProgress(null);
      setLargeFileWarning(false);

      // Warn if estimated file size is large
      const estimatedSize = completedVideos.length * ESTIMATED_BYTES_PER_CLIP;
      if (estimatedSize > LARGE_FILE_WARNING_BYTES) {
        setLargeFileWarning(true);
      }

      try {
        const videoUrls = completedVideos.map((v) => v.videoUrl!);

        // Build transitions — dissolve between clips, longer at act boundaries
        const transitions = completedVideos.slice(1).map((_, i) => {
          const isActBoundary = (i + 1) % 3 === 0;
          return {
            type: 'dissolve' as const,
            duration: isActBoundary ? 1.0 : 0.5,
          };
        });

        // Resolve soundtrack (only when audio is enabled)
        const selectedTrack = getSoundtrack(state.selectedSoundtrack);
        const backgroundMusicUrl =
          state.includeAudio && selectedTrack.id !== 'none' && selectedTrack.previewUrl
            ? selectedTrack.previewUrl
            : undefined;

        if (autoContinuity) {
          setStatus('analyzing');
          setStatusMessage(
            'Analyzing frame-by-frame continuity across clips...',
          );
        } else {
          setStatus('stitching');
          setStatusMessage(`Stitching ${videoUrls.length} clips...`);
        }

        // Build unified refs for bridge clip character + environment consistency
        const stitchRefSet = buildReferenceImageSet(state);
        // For bridge clips, pass character refs to maintain face consistency
        const subjectReferenceImages = stitchRefSet.referenceImages.slice(0, stitchRefSet.characterCount);

        const res = await fetch('/api/stitch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            videoUrls,
            transitions,
            format: state.exportFormat,
            colorIndex: state.colorIndex,
            autoContinuity,
            maxBridgeClips,
            videoModelId: state.selectedVideoModel,
            subjectReferenceImages,
            // When audio is disabled, tell the API to strip all audio tracks
            muteVideo: !state.includeAudio,
            ...(backgroundMusicUrl ? { backgroundMusicUrl } : {}),
            ...(state.includeAudio && state.voiceoverUrl
              ? { voiceoverUrl: state.voiceoverUrl }
              : {}),
          }),
        });

        if (!res.ok) {
          const err = await res
            .json()
            .catch(() => ({ error: 'Stitching failed' }));
          throw new Error(err.error || 'Stitching failed');
        }

        // Read continuity report from headers
        const gapsDetected = parseInt(
          res.headers.get('X-Continuity-Gaps-Detected') ?? '0',
          10,
        );
        const gapsFixed = parseInt(
          res.headers.get('X-Continuity-Gaps-Fixed') ?? '0',
          10,
        );
        const report: ContinuityReport = { gapsDetected, gapsFixed };
        setContinuity(report);

        setStatus('grading');
        setStatusMessage(
          gapsDetected > 0
            ? `Fixed ${gapsFixed}/${gapsDetected} continuity gaps. Downloading film...`
            : 'All frames match. Downloading film...',
        );

        // Stream the response body with progress tracking
        const blob = await streamToBlob(
          res,
          controller.signal,
          (p) => {
            setProgress(p);
            if (p.percent !== null) {
              setStatusMessage(
                gapsDetected > 0
                  ? `Fixed ${gapsFixed}/${gapsDetected} gaps. Downloading... ${p.percent}%`
                  : `Downloading film... ${p.percent}%`,
              );
            }
          },
        );

        const objectUrl = URL.createObjectURL(blob);

        setFilmUrl(objectUrl);
        setStatus('done');
        setStatusMessage('');
        setProgress(null);
        abortControllerRef.current = null;

        return { filmUrl: objectUrl, blob, continuity: report };
      } catch (err) {
        // Don't overwrite state if this was an intentional abort
        if (err instanceof DOMException && err.name === 'AbortError') {
          setError('Stitching was cancelled');
          setStatus('idle');
          setStatusMessage('');
          setProgress(null);
          abortControllerRef.current = null;
          return null;
        }

        const msg = err instanceof Error ? err.message : 'Stitching failed';
        setError(msg);
        setStatus('error');
        setStatusMessage('');
        setProgress(null);
        abortControllerRef.current = null;
        return null;
      }
    },
    [
      completedVideos,
      state.selectedSoundtrack,
      state.voiceoverUrl,
      state.exportFormat,
      state.colorIndex,
      state.selectedVideoModel,
      state.includeAudio,
    ],
  );

  /** Abort an in-progress stitch operation. */
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const download = useCallback(
    (filename?: string) => {
      if (!filmUrl) return;
      const a = document.createElement('a');
      a.href = filmUrl;
      a.download = filename ?? `director-film.${state.exportFormat}`;
      a.click();
    },
    [filmUrl, state.exportFormat],
  );

  const reset = useCallback(() => {
    // Abort any in-progress operation before resetting
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (filmUrl) URL.revokeObjectURL(filmUrl);
    setFilmUrl(null);
    setStatus('idle');
    setStatusMessage('');
    setError(null);
    setContinuity(null);
    setProgress(null);
    setLargeFileWarning(false);
  }, [filmUrl]);

  return {
    stitch,
    abort,
    download,
    reset,
    status,
    statusMessage,
    filmUrl,
    error,
    continuity,
    progress,
    largeFileWarning,
    estimatedClips,
    estimatedDuration,
    canStitch: completedVideos.length >= 2,
  };
}
