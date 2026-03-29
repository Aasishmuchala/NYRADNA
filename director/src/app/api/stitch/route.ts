import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink, readFile, rm, stat } from 'fs/promises';
import { createReadStream } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import { fixContinuityGaps } from '@/lib/continuityAnalysis';
import { validateUrl, validateUrls } from '@/lib/urlValidation';

// ─── Constants ─────────────────────────────────────────────────────
const SEGMENT_SIZE = 20;
const FFMPEG_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const DOWNLOAD_TIMEOUT_MS = 60 * 1000; // 60 seconds per download

// ─── Color LUT mapping (matches colorIndex from Style DNA) ─────────
const COLOR_LUT_FILES: Record<number, string> = {
  0: 'action_orange.cube',
  1: 'electric_blue.cube',
  2: 'cyber_purple.cube',
  3: 'neon_pink.cube',
  4: 'matrix_green.cube',
};

interface StitchRequest {
  videoUrls: string[];
  transitions?: { type: 'cut' | 'dissolve' | 'fade-from-black' | 'fade-to-black'; duration: number }[];
  format?: 'mp4' | 'mov' | 'webm';
  colorIndex?: number;
  backgroundMusicUrl?: string;
  voiceoverUrl?: string;
  watermark?: boolean;
  autoContinuity?: boolean;
  maxBridgeClips?: number;
  videoModelId?: string;
  subjectReferenceImages?: string[];
  muteVideo?: boolean;
}

// ─── Timeout wrapper for FFmpeg operations ─────────────────────────
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout after ${timeoutMs}ms: ${label}`));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// ─── Download with AbortController timeout ─────────────────────────
async function downloadFileWithTimeout(url: string, destPath: string): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Failed to download: ${url} (status ${res.status})`);
    const buffer = Buffer.from(await res.arrayBuffer());
    await writeFile(destPath, buffer);
  } finally {
    clearTimeout(timer);
  }
}

// ─── Cleanup helper: remove files, ignore errors ───────────────────
async function cleanupFiles(paths: string[]): Promise<void> {
  for (const p of paths) {
    unlink(p).catch(() => {});
  }
}

// ─── Chunk array into segments ─────────────────────────────────────
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function stitchVideos(
  inputPaths: string[],
  outputPath: string,
  transitions: StitchRequest['transitions'],
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (inputPaths.length === 0) {
      return reject(new Error('No input files'));
    }

    // Simple concat if no transitions or only cuts
    const hasTransitions = transitions?.some((t) => t.type !== 'cut' && t.duration > 0);

    if (!hasTransitions || inputPaths.length === 1) {
      // Use concat demuxer for simple concatenation
      const listContent = inputPaths.map((p) => `file '${p}'`).join('\n');
      const listPath = outputPath.replace(/\.[^.]+$/, '_list.txt');

      writeFile(listPath, listContent).then(() => {
        ffmpeg()
          .input(listPath)
          .inputOptions(['-f', 'concat', '-safe', '0'])
          .outputOptions(['-c', 'copy'])
          .output(outputPath)
          .on('end', () => {
            unlink(listPath).catch(() => {});
            resolve();
          })
          .on('error', (err) => {
            unlink(listPath).catch(() => {});
            reject(err);
          })
          .run();
      });
      return;
    }

    // Build xfade filter chain for transitions
    const cmd = ffmpeg();
    for (const path of inputPaths) {
      cmd.input(path);
    }

    const filterParts: string[] = [];
    let prevLabel = '0:v';
    let offset = 0;

    // We need to probe durations — estimate 5s per clip as default
    const clipDuration = 5;

    for (let i = 1; i < inputPaths.length; i++) {
      const transition = transitions?.[i - 1];
      const tType = transition?.type === 'dissolve' ? 'fade' :
                    transition?.type === 'fade-to-black' ? 'fade' :
                    transition?.type === 'fade-from-black' ? 'fade' : 'fade';
      const tDuration = transition?.duration ?? 0.5;

      offset += clipDuration - tDuration;
      const outLabel = i < inputPaths.length - 1 ? `v${i}` : 'vout';

      filterParts.push(
        `[${prevLabel}][${i}:v]xfade=transition=${tType}:duration=${tDuration}:offset=${offset}[${outLabel}]`
      );
      prevLabel = outLabel;
    }

    // Also merge audio streams if present
    const audioMerge = inputPaths.map((_, i) => `[${i}:a]`).join('');
    filterParts.push(`${audioMerge}concat=n=${inputPaths.length}:v=0:a=1[aout]`);

    cmd
      .complexFilter(filterParts.join(';'))
      .outputOptions(['-map', '[vout]', '-map', '[aout]', '-c:v', 'libx264', '-c:a', 'aac', '-shortest'])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err: Error) => {
        // Fallback: if complex filter fails (e.g. no audio), try video-only
        const videoOnlyParts = filterParts.filter((p) => !p.includes('concat=n='));
        if (videoOnlyParts.length > 0) {
          const cmd2 = ffmpeg();
          for (const path of inputPaths) {
            cmd2.input(path);
          }
          cmd2
            .complexFilter(videoOnlyParts.join(';'))
            .outputOptions(['-map', '[vout]', '-c:v', 'libx264'])
            .output(outputPath)
            .on('end', () => resolve())
            .on('error', (e: Error) => reject(e))
            .run();
        } else {
          reject(err);
        }
      })
      .run();
  });
}

/**
 * Applies a color LUT and/or watermark to the stitched video.
 */
function applyColorLUT(inputPath: string, outputPath: string, lutPath: string, watermark?: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const filters: string[] = [`lut3d=${lutPath}`];
    if (watermark) {
      filters.push(`drawtext=text='DIRECTOR AI':fontsize=18:fontcolor=white@0.3:x=w-tw-20:y=h-th-20`);
    }
    ffmpeg(inputPath)
      .videoFilters(filters.join(','))
      .outputOptions(['-c:v', 'libx264', '-c:a', 'copy', '-crf', '18'])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err))
      .run();
  });
}

/**
 * Applies only the watermark text overlay (no LUT).
 */
function applyWatermark(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoFilters(`drawtext=text='DIRECTOR AI':fontsize=18:fontcolor=white@0.3:x=w-tw-20:y=h-th-20`)
      .outputOptions(['-c:v', 'libx264', '-c:a', 'copy', '-crf', '18'])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err))
      .run();
  });
}

/**
 * Normalizes color/brightness across clips using the first clip as reference.
 * Uses FFmpeg's colorlevels + normalize filters to match histogram.
 */
function normalizeClipColors(
  clipPaths: string[],
  outputDir: string,
): Promise<string[]> {
  if (clipPaths.length <= 1) return Promise.resolve(clipPaths);

  // The first clip is the reference — all others are normalized to match its look.
  // We use FFmpeg's normalize filter which auto-adjusts levels.
  const normalizedPaths: string[] = [clipPaths[0]]; // First clip stays as-is

  const normalizeOne = (inputPath: string, outputPath: string): Promise<void> =>
    new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilters([
          // normalize: auto-adjusts contrast/brightness to match consistent range
          'normalize=blackpt=black:whitept=white:smoothing=20',
        ])
        .outputOptions(['-c:v', 'libx264', '-c:a', 'copy', '-crf', '18', '-preset', 'fast'])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', () => {
          // If normalize filter not available, just copy through
          resolve();
        })
        .run();
    });

  return (async () => {
    for (let i = 1; i < clipPaths.length; i++) {
      const outPath = join(outputDir, `normalized_${i}.mp4`);
      try {
        await normalizeOne(clipPaths[i], outPath);
        // Check if the normalized file exists and has size
        const stats = await stat(outPath).catch(() => null);
        if (stats && stats.size > 0) {
          normalizedPaths.push(outPath);
        } else {
          normalizedPaths.push(clipPaths[i]); // Fallback to original
        }
      } catch {
        normalizedPaths.push(clipPaths[i]); // Fallback to original
      }
    }
    return normalizedPaths;
  })();
}

/**
 * Mixes background music and/or voiceover into the video's audio track.
 */
function mixAudio(
  videoPath: string,
  outputPath: string,
  options: { backgroundMusicPath?: string; voiceoverPath?: string },
): Promise<void> {
  return new Promise((resolve, reject) => {
    const cmd = ffmpeg(videoPath);
    const filterParts: string[] = [];
    const inputLabels: string[] = [];
    let inputIndex = 1;

    if (options.backgroundMusicPath) {
      cmd.input(options.backgroundMusicPath);
      filterParts.push(`[${inputIndex}:a]volume=0.15[music]`);
      inputLabels.push('[music]');
      inputIndex++;
    }

    if (options.voiceoverPath) {
      cmd.input(options.voiceoverPath);
      filterParts.push(`[${inputIndex}:a]volume=1.0[vo]`);
      inputLabels.push('[vo]');
      inputIndex++;
    }

    if (inputLabels.length === 0) {
      return resolve();
    }

    const videoAudioVolume = options.voiceoverPath ? 0.3 : 1.0;
    filterParts.push(`[0:a]volume=${videoAudioVolume}[origaudio]`);

    const allLabels = ['[origaudio]', ...inputLabels];
    const mixInputCount = allLabels.length;
    filterParts.push(
      `${allLabels.join('')}amix=inputs=${mixInputCount}:duration=longest:dropout_transition=2[mixedaudio]`,
    );

    cmd
      .complexFilter(filterParts.join(';'))
      .outputOptions(['-map', '0:v', '-map', '[mixedaudio]', '-c:v', 'copy', '-c:a', 'aac', '-shortest'])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', () => {
        // Fallback: if video has no audio track, try without [0:a]
        const cmd2 = ffmpeg(videoPath);
        const fallbackParts: string[] = [];
        let fi = 1;

        if (options.backgroundMusicPath) {
          cmd2.input(options.backgroundMusicPath);
          fallbackParts.push(`[${fi}:a]volume=0.15[music]`);
          fi++;
        }
        if (options.voiceoverPath) {
          cmd2.input(options.voiceoverPath);
          fallbackParts.push(`[${fi}:a]volume=1.0[vo]`);
          fi++;
        }

        const externalLabels: string[] = [];
        if (options.backgroundMusicPath) externalLabels.push('[music]');
        if (options.voiceoverPath) externalLabels.push('[vo]');

        if (externalLabels.length === 1) {
          const label = externalLabels[0].replace('[', '').replace(']', '');
          fallbackParts.push(`${externalLabels[0]}acopy[${label}out]`);
          cmd2
            .complexFilter(fallbackParts.join(';'))
            .outputOptions(['-map', '0:v', '-map', `[${label}out]`, '-c:v', 'copy', '-c:a', 'aac', '-shortest'])
            .output(outputPath)
            .on('end', () => resolve())
            .on('error', (e: Error) => reject(e))
            .run();
        } else {
          fallbackParts.push(
            `${externalLabels.join('')}amix=inputs=${externalLabels.length}:duration=longest[mixedaudio]`,
          );
          cmd2
            .complexFilter(fallbackParts.join(';'))
            .outputOptions(['-map', '0:v', '-map', '[mixedaudio]', '-c:v', 'copy', '-c:a', 'aac', '-shortest'])
            .output(outputPath)
            .on('end', () => resolve())
            .on('error', (e: Error) => reject(e))
            .run();
        }
      })
      .run();
  });
}

// ─── Main POST handler (chunked processing) ────────────────────────

export async function POST(req: NextRequest) {
  let workDir = '';

  try {
    const body: StitchRequest = await req.json();
    const {
      videoUrls,
      transitions,
      format = 'mp4',
      colorIndex,
      backgroundMusicUrl,
      voiceoverUrl,
      watermark = true,
      autoContinuity = true,
      maxBridgeClips = 5,
      videoModelId,
      muteVideo = false,
    } = body;

    if (!videoUrls || !Array.isArray(videoUrls) || videoUrls.length === 0) {
      return NextResponse.json({ error: 'videoUrls is required and must be a non-empty array' }, { status: 400 });
    }
    if (videoUrls.length > 200) {
      return NextResponse.json({ error: 'videoUrls exceeds maximum of 200 clips' }, { status: 400 });
    }

    // Validate all URLs against SSRF
    const urlsCheck = validateUrls(videoUrls, { trustedOnly: true });
    if (!urlsCheck.valid) {
      return NextResponse.json({ error: `Invalid videoUrl: ${urlsCheck.error}` }, { status: 400 });
    }
    if (backgroundMusicUrl) {
      const bgCheck = validateUrl(backgroundMusicUrl);
      if (!bgCheck.valid) {
        return NextResponse.json({ error: `Invalid backgroundMusicUrl: ${bgCheck.error}` }, { status: 400 });
      }
    }
    if (voiceoverUrl) {
      const voCheck = validateUrl(voiceoverUrl);
      if (!voCheck.valid) {
        return NextResponse.json({ error: `Invalid voiceoverUrl: ${voCheck.error}` }, { status: 400 });
      }
    }

    const replicateToken = process.env.REPLICATE_API_TOKEN;
    const ext = format === 'mov' ? 'mov' : format === 'webm' ? 'webm' : 'mp4';

    // Scale maxBridgeClips proportionally for long-form content
    const scaledMaxBridgeClips = Math.max(maxBridgeClips, Math.ceil(videoUrls.length * 0.1));

    // Create top-level temp directory
    workDir = join(tmpdir(), `director-stitch-${randomUUID()}`);
    await mkdir(workDir, { recursive: true });

    // ─── Chunked Processing ──────────────────────────────────────
    // Split clips into segments of SEGMENT_SIZE, process each independently
    const urlChunks = chunkArray(videoUrls, SEGMENT_SIZE);
    const transitionChunks = transitions
      ? chunkArray(transitions, SEGMENT_SIZE)
      : urlChunks.map(() => undefined);

    const segmentOutputPaths: string[] = [];
    let totalContinuityGapsDetected = 0;
    let totalContinuityGapsFixed = 0;
    const failedSegments: number[] = [];

    for (let segIdx = 0; segIdx < urlChunks.length; segIdx++) {
      const segmentUrls = urlChunks[segIdx];
      const segmentTransitions = transitionChunks[segIdx];

      // Each segment gets its own sub-directory for isolation
      const segDir = join(workDir, `segment-${segIdx}`);
      await mkdir(segDir, { recursive: true });

      try {
        // Step 1: Download clips for this segment
        const clipPaths: string[] = [];
        for (let i = 0; i < segmentUrls.length; i++) {
          const clipPath = join(segDir, `clip-${i}.mp4`);
          await withTimeout(
            downloadFileWithTimeout(segmentUrls[i], clipPath),
            DOWNLOAD_TIMEOUT_MS + 5000,
            `download clip ${segIdx * SEGMENT_SIZE + i}`,
          );
          clipPaths.push(clipPath);
        }

        // Step 2: Continuity analysis for this segment
        let finalClipPaths = clipPaths;
        let segmentTransitionsFinal: StitchRequest['transitions'] = segmentTransitions;

        // Scale bridge clips per segment proportionally
        const segmentMaxBridges = Math.max(
          1,
          Math.ceil(scaledMaxBridgeClips * (segmentUrls.length / videoUrls.length)),
        );

        if (autoContinuity && clipPaths.length >= 2 && replicateToken) {
          try {
            const fixResult = await fixContinuityGaps(
              clipPaths,
              segDir,
              replicateToken,
              { maxBridges: segmentMaxBridges, videoModelId, subjectReferenceImages: body.subjectReferenceImages },
            );

            finalClipPaths = fixResult.fixedClipPaths;
            totalContinuityGapsDetected += fixResult.gapsDetected;
            totalContinuityGapsFixed += fixResult.gapsFixed;

            // Rebuild transitions if bridge clips were inserted
            if (finalClipPaths.length > clipPaths.length && segmentTransitions) {
              segmentTransitionsFinal = [];
              let origIdx = 0;
              for (let i = 0; i < finalClipPaths.length - 1; i++) {
                const isBridgeConnection =
                  !clipPaths.includes(finalClipPaths[i]) ||
                  !clipPaths.includes(finalClipPaths[i + 1]);
                if (isBridgeConnection) {
                  segmentTransitionsFinal.push({ type: 'dissolve', duration: 0.3 });
                } else {
                  segmentTransitionsFinal.push(
                    segmentTransitions[origIdx] ?? { type: 'dissolve', duration: 0.5 },
                  );
                  origIdx++;
                }
              }
            }
          } catch {
            // If continuity analysis fails, proceed with original clips
          }
        }

        // Step 3a: Color normalize clips within segment (match to first clip's histogram)
        let normalizedClipPaths = finalClipPaths;
        try {
          const normDir = join(workDir, `seg-${segIdx}-norm`);
          await mkdir(normDir, { recursive: true });
          normalizedClipPaths = await withTimeout(
            normalizeClipColors(finalClipPaths, normDir),
            FFMPEG_TIMEOUT_MS,
            `normalize colors segment ${segIdx}`,
          );
        } catch {
          // If normalization fails, use original clips
          normalizedClipPaths = finalClipPaths;
        }

        // Step 3b: Stitch this segment
        const segOutputPath = join(workDir, `segment-${segIdx}.${ext}`);
        await withTimeout(
          stitchVideos(normalizedClipPaths, segOutputPath, segmentTransitionsFinal),
          FFMPEG_TIMEOUT_MS,
          `stitch segment ${segIdx}`,
        );

        segmentOutputPaths.push(segOutputPath);

        // Step 4: Cleanup segment source clips to free disk space
        await cleanupFiles(finalClipPaths);
        // Remove the segment working directory
        rm(segDir, { recursive: true, force: true }).catch(() => {});
      } catch (err) {
        // Error recovery: skip this segment, continue with the rest
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`Segment ${segIdx} failed (clips ${segIdx * SEGMENT_SIZE}-${segIdx * SEGMENT_SIZE + segmentUrls.length - 1}): ${errMsg}`);
        failedSegments.push(segIdx);

        // Cleanup the failed segment's files
        rm(segDir, { recursive: true, force: true }).catch(() => {});
        continue;
      }
    }

    // Bail out if no segments succeeded
    if (segmentOutputPaths.length === 0) {
      return NextResponse.json(
        { error: `All ${urlChunks.length} segments failed. No output produced.` },
        { status: 500 },
      );
    }

    // ─── Final Merge Pass ────────────────────────────────────────
    // Stitch all segment outputs together (simple concat, no transitions between segments)
    let stitchedPath: string;
    if (segmentOutputPaths.length === 1) {
      stitchedPath = segmentOutputPaths[0];
    } else {
      stitchedPath = join(workDir, `stitched.${ext}`);
      await withTimeout(
        stitchVideos(segmentOutputPaths, stitchedPath, undefined),
        FFMPEG_TIMEOUT_MS,
        'final merge pass',
      );

      // Cleanup segment outputs after merge
      await cleanupFiles(segmentOutputPaths);
    }

    // ─── Post-processing (LUT, watermark, audio) ────────────────
    let finalPath = stitchedPath;
    const lutFile = colorIndex !== undefined ? COLOR_LUT_FILES[colorIndex] : undefined;
    if (lutFile) {
      const lutPath = join(process.cwd(), 'public', 'luts', lutFile);
      const gradedPath = join(workDir, `film.${ext}`);
      try {
        await withTimeout(
          applyColorLUT(stitchedPath, gradedPath, lutPath, watermark),
          FFMPEG_TIMEOUT_MS,
          'apply color LUT',
        );
        finalPath = gradedPath;
      } catch {
        finalPath = stitchedPath;
      }
    } else if (watermark) {
      const watermarkedPath = join(workDir, `watermarked.${ext}`);
      try {
        await withTimeout(
          applyWatermark(stitchedPath, watermarkedPath),
          FFMPEG_TIMEOUT_MS,
          'apply watermark',
        );
        finalPath = watermarkedPath;
      } catch {
        finalPath = stitchedPath;
      }
    }

    // Strip audio if user disabled it and no external audio will be mixed
    if (muteVideo && !backgroundMusicUrl && !voiceoverUrl) {
      const mutedPath = join(workDir, `muted.${ext}`);
      try {
        await new Promise<void>((resolve, reject) => {
          ffmpeg(finalPath)
            .outputOptions(['-c:v', 'copy', '-an']) // copy video, strip audio
            .output(mutedPath)
            .on('end', () => resolve())
            .on('error', (err: Error) => reject(err))
            .run();
        });
        finalPath = mutedPath;
      } catch {
        // If muting fails, keep original (audio will remain)
      }
    }

    // Audio mixing
    if (backgroundMusicUrl || voiceoverUrl) {
      let musicPath: string | undefined;
      let voPath: string | undefined;

      if (backgroundMusicUrl) {
        musicPath = join(workDir, 'bg-music.mp3');
        await downloadFileWithTimeout(backgroundMusicUrl, musicPath);
      }

      if (voiceoverUrl) {
        voPath = join(workDir, 'voiceover.mp3');
        await downloadFileWithTimeout(voiceoverUrl, voPath);
      }

      const mixedPath = join(workDir, `mixed.${ext}`);
      try {
        await withTimeout(
          mixAudio(finalPath, mixedPath, {
            backgroundMusicPath: musicPath,
            voiceoverPath: voPath,
          }),
          FFMPEG_TIMEOUT_MS,
          'mix audio',
        );
        finalPath = mixedPath;
      } catch {
        // If audio mixing fails, fall back to the video without mixed audio
      }
    }

    // ─── Stream the final output ─────────────────────────────────
    // Use createReadStream instead of readFile to avoid loading full file into memory
    const fileStat = await stat(finalPath);
    const fileSize = fileStat.size;

    const contentType = format === 'webm' ? 'video/webm' :
                        format === 'mov' ? 'video/quicktime' : 'video/mp4';

    const stream = createReadStream(finalPath);

    // Convert Node.js ReadStream to a Web ReadableStream
    const readableStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk: string | Buffer) => {
          const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
          controller.enqueue(new Uint8Array(buf));
        });
        stream.on('end', () => {
          controller.close();
          // Fire-and-forget cleanup of the entire work directory
          rm(workDir, { recursive: true, force: true }).catch(() => {});
        });
        stream.on('error', (err) => {
          controller.error(err);
          rm(workDir, { recursive: true, force: true }).catch(() => {});
        });
      },
    });

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="director-film.${ext}"`,
      'Content-Length': String(fileSize),
      'X-Continuity-Gaps-Detected': String(totalContinuityGapsDetected),
      'X-Continuity-Gaps-Fixed': String(totalContinuityGapsFixed),
    };

    if (failedSegments.length > 0) {
      headers['X-Segments-Failed'] = failedSegments.join(',');
      headers['X-Segments-Total'] = String(urlChunks.length);
      headers['X-Segments-Succeeded'] = String(urlChunks.length - failedSegments.length);
    }

    return new NextResponse(readableStream, { headers });
  } catch (error) {
    // Cleanup on top-level failure
    if (workDir) {
      rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
    const message = error instanceof Error ? error.message : 'Video stitching failed';
    console.error('[/api/stitch] Error:', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
