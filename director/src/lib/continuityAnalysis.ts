/**
 * Continuity Analysis & Bridge Generation
 *
 * Detects visual discontinuities between adjacent clips and generates
 * AI bridge frames to smooth transitions. Used during the stitch pipeline.
 *
 * Flow:
 * 1. Extract last frame of clip A + first frame of clip B
 * 2. Compare using FFmpeg SSIM (structural similarity)
 * 3. If SSIM < threshold → mismatch detected
 * 4. Generate bridge frame(s) via Replicate image-to-image
 * 5. Convert bridge frames into a short transition clip
 * 6. Insert bridge clip between A and B before final stitch
 */

import { writeFile, unlink, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import ffmpeg from 'fluent-ffmpeg';

// ─── Types ──────────────────────────────────────────────────────────

export interface FramePair {
  clipIndex: number;
  lastFramePath: string;   // last frame of clip[i]
  firstFramePath: string;  // first frame of clip[i+1]
}

export interface ContinuityGap {
  clipIndex: number;
  ssim: number;
  severity: 'minor' | 'moderate' | 'severe';
  lastFramePath: string;
  firstFramePath: string;
}

export interface BridgeClip {
  clipIndex: number;       // insert after this clip index
  videoPath: string;       // path to generated bridge video
  durationSeconds: number;
}

// SSIM thresholds — tuned for cinematic footage
const SSIM_THRESHOLD_OK = 0.65;        // above this = acceptable continuity
const SSIM_THRESHOLD_MODERATE = 0.45;  // between moderate and OK = minor fix needed
// below MODERATE = severe discontinuity, needs AI bridge

// ─── Frame Extraction ───────────────────────────────────────────────

/**
 * Extracts a single frame from a video file at the given position.
 */
export async function extractFrameFromFile(
  videoPath: string,
  position: 'first' | 'last',
  outputDir: string,
): Promise<string> {
  const framePath = join(outputDir, `frame-${position}-${randomUUID().slice(0, 8)}.png`);

  if (position === 'first') {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .seekInput(0)
        .frames(1)
        .output(framePath)
        .on('end', () => resolve())
        .on('error', (e: Error) => reject(e))
        .run();
    });
  } else {
    // Get duration first, then seek to near-end
    const duration = await getVideoDuration(videoPath);
    const seekTime = Math.max(0, duration - 0.1);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .seekInput(seekTime)
        .frames(1)
        .output(framePath)
        .on('end', () => resolve())
        .on('error', (e: Error) => reject(e))
        .run();
    });
  }

  return framePath;
}

function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration ?? 5);
    });
  });
}

// ─── Frame Comparison (SSIM) ────────────────────────────────────────

/**
 * Compares two frames using FFmpeg's SSIM filter.
 * Returns a score between 0 (completely different) and 1 (identical).
 */
export async function compareFramesSSIM(
  frameA: string,
  frameB: string,
): Promise<number> {
  return new Promise((resolve) => {
    // FFmpeg SSIM filter compares two inputs and outputs similarity score
    // We create a dummy output and parse SSIM from stderr/logs
    const logPath = join(tmpdir(), `ssim-${randomUUID().slice(0, 8)}.log`);

    ffmpeg(frameA)
      .input(frameB)
      .complexFilter([
        `[0:v]scale=320:240,format=yuv420p[a]`,
        `[1:v]scale=320:240,format=yuv420p[b]`,
        `[a][b]ssim=stats_file=${logPath}`,
      ])
      .outputOptions(['-f', 'null'])
      .output('-')
      .on('end', async () => {
        try {
          const log = await readFile(logPath, 'utf-8');
          // Parse "All:0.xxxx" from SSIM output
          const match = log.match(/All:([\d.]+)/);
          const ssim = match ? parseFloat(match[1]) : 0.5;
          unlink(logPath).catch(() => {});
          resolve(ssim);
        } catch {
          unlink(logPath).catch(() => {});
          resolve(0.5); // default to moderate if parsing fails
        }
      })
      .on('error', () => {
        unlink(logPath).catch(() => {});
        // Fallback: use simpler color histogram comparison
        compareFramesFallback(frameA, frameB).then(resolve);
      })
      .run();
  });
}

/**
 * Fallback frame comparison using average color difference.
 * Used when SSIM filter fails (e.g., different resolutions).
 */
async function compareFramesFallback(
  frameA: string,
  frameB: string,
): Promise<number> {
  try {
    // Extract average color values using FFmpeg signalstats
    const getAvgColor = (path: string): Promise<[number, number, number]> => {
      return new Promise((resolve) => {
        let output = '';
        ffmpeg(path)
          .videoFilters('signalstats=stat=tout+vrep+brng')
          .frames(1)
          .outputOptions(['-f', 'null'])
          .output('-')
          .on('stderr', (line: string) => { output += line; })
          .on('end', () => {
            // Parse YAVG, UAVG, VAVG from signalstats
            const yMatch = output.match(/YAVG=([\d.]+)/);
            const uMatch = output.match(/UAVG=([\d.]+)/);
            const vMatch = output.match(/VAVG=([\d.]+)/);
            resolve([
              yMatch ? parseFloat(yMatch[1]) : 128,
              uMatch ? parseFloat(uMatch[1]) : 128,
              vMatch ? parseFloat(vMatch[1]) : 128,
            ]);
          })
          .on('error', () => resolve([128, 128, 128]))
          .run();
      });
    };

    const [colorA, colorB] = await Promise.all([getAvgColor(frameA), getAvgColor(frameB)]);

    // Euclidean distance in YUV space, normalized to 0-1
    const dist = Math.sqrt(
      (colorA[0] - colorB[0]) ** 2 +
      (colorA[1] - colorB[1]) ** 2 +
      (colorA[2] - colorB[2]) ** 2
    );
    const maxDist = Math.sqrt(255 ** 2 * 3);
    return Math.max(0, 1 - dist / maxDist);
  } catch {
    return 0.5;
  }
}

// ─── Continuity Gap Detection ───────────────────────────────────────

/**
 * Analyzes all adjacent clip pairs and identifies continuity gaps.
 */
export async function detectContinuityGaps(
  clipPaths: string[],
  workDir: string,
): Promise<ContinuityGap[]> {
  if (clipPaths.length < 2) return [];

  const gaps: ContinuityGap[] = [];
  const BATCH_SIZE = 5;

  // Build list of pair indices to process
  const pairIndices: number[] = [];
  for (let i = 0; i < clipPaths.length - 1; i++) {
    pairIndices.push(i);
  }

  // Process pairs in parallel batches of BATCH_SIZE
  for (let batchStart = 0; batchStart < pairIndices.length; batchStart += BATCH_SIZE) {
    const batch = pairIndices.slice(batchStart, batchStart + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(async (i) => {
        const lastFrame = await extractFrameFromFile(clipPaths[i], 'last', workDir);
        const firstFrame = await extractFrameFromFile(clipPaths[i + 1], 'first', workDir);

        const ssim = await compareFramesSSIM(lastFrame, firstFrame);

        if (ssim < SSIM_THRESHOLD_OK) {
          const severity: ContinuityGap['severity'] =
            ssim < SSIM_THRESHOLD_MODERATE ? 'severe' :
            ssim < SSIM_THRESHOLD_OK ? 'moderate' : 'minor';

          return {
            clipIndex: i,
            ssim,
            severity,
            lastFramePath: lastFrame,
            firstFramePath: firstFrame,
          } as ContinuityGap;
        } else {
          // Clean up frames we don't need
          unlink(lastFrame).catch(() => {});
          unlink(firstFrame).catch(() => {});
          return null;
        }
      })
    );

    for (const result of batchResults) {
      if (result) gaps.push(result);
    }
  }

  return gaps;
}

// ─── Bridge Frame Generation ────────────────────────────────────────

/**
 * Generates a bridge image that smoothly transitions between two frames.
 * Uses Replicate image generation with both frames as context.
 */
export async function generateBridgeFrame(
  lastFramePath: string,
  firstFramePath: string,
  replicateToken: string,
): Promise<string | null> {
  try {
    const Replicate = (await import('replicate')).default;
    const replicate = new Replicate({ auth: replicateToken });

    // Read both frames as base64
    const lastFrameBuffer = await readFile(lastFramePath);
    const firstFrameBuffer = await readFile(firstFramePath);
    const lastFrameB64 = `data:image/png;base64,${lastFrameBuffer.toString('base64')}`;
    const firstFrameB64 = `data:image/png;base64,${firstFrameBuffer.toString('base64')}`;

    // Use image-to-image with the last frame as base, prompting toward the next frame's content
    // This creates a natural mid-point between the two frames
    const prediction = await replicate.predictions.create({
      model: 'black-forest-labs/flux-fill-pro' as `${string}/${string}`,
      input: {
        image: lastFrameB64,
        mask: lastFrameB64, // full image mask = full regeneration guided by prompt
        prompt: 'smooth cinematic transition, seamless visual continuity, matching lighting and color grading, professional film transition frame, same scene same style',
        guidance: 15,
      },
    });

    // Poll for result with hard 3-minute timeout
    const HARD_TIMEOUT_MS = 3 * 60 * 1000;
    const abortController = new AbortController();
    const hardTimeoutId = setTimeout(() => abortController.abort(), HARD_TIMEOUT_MS);

    try {
      let result = prediction;
      let attempts = 0;
      const maxAttempts = 60;

      while (
        result.status !== 'succeeded' &&
        result.status !== 'failed' &&
        result.status !== 'canceled' &&
        attempts < maxAttempts
      ) {
        if (abortController.signal.aborted) {
          return null;
        }
        await new Promise((r) => setTimeout(r, 2000));
        result = await replicate.predictions.get(result.id);
        attempts++;
      }

      if (result.status !== 'succeeded' || !result.output) return null;

      const outputUrl = Array.isArray(result.output) ? result.output[0] : String(result.output);

      // Download the generated bridge frame
      const res = await fetch(outputUrl, { signal: abortController.signal });
      if (!res.ok) return null;

      const bridgeBuffer = Buffer.from(await res.arrayBuffer());
      const bridgePath = lastFramePath.replace(/frame-last/, 'bridge');
      await writeFile(bridgePath, bridgeBuffer);

      return bridgePath;
    } finally {
      clearTimeout(hardTimeoutId);
    }
  } catch {
    return null;
  }
}

/**
 * Uses Replicate video generation to create a smooth bridge clip
 * from the last frame of clip A, guided toward clip B's content.
 */
export async function generateBridgeVideo(
  lastFramePath: string,
  firstFramePath: string,
  workDir: string,
  replicateToken: string,
  videoModelId?: string,
  subjectReferenceImages?: string[],
): Promise<BridgeClip | null> {
  try {
    const Replicate = (await import('replicate')).default;
    const replicate = new Replicate({ auth: replicateToken });

    // Read last frame as base64 for start_image
    const lastFrameBuffer = await readFile(lastFramePath);
    const lastFrameB64 = `data:image/png;base64,${lastFrameBuffer.toString('base64')}`;

    // Read first frame of next clip to guide the bridge toward it
    let targetDesc = '';
    try {
      const firstFrameBuffer = await readFile(firstFramePath);
      const firstFrameSize = firstFrameBuffer.length;
      // Use file size difference as a rough indicator of scene change magnitude
      const sizeRatio = firstFrameSize / Math.max(lastFrameBuffer.length, 1);
      if (sizeRatio > 1.5 || sizeRatio < 0.67) {
        targetDesc = ', gradual scene transition with smooth lighting shift';
      }
    } catch {
      // If we can't read the first frame, proceed without target guidance
    }

    // Generate a short 2-second transition video from the last frame
    const modelId = videoModelId ?? 'kwaivgi/kling-v3-omni-video';

    const input: Record<string, unknown> = {
      start_image: lastFrameB64,
      prompt: `smooth subtle camera movement, gentle cinematic transition, maintaining exact same lighting and color palette, seamless visual flow, same environment and atmosphere${targetDesc}`,
      duration: 2,
      mode: 'standard',
      aspect_ratio: '16:9',
    };

    // Add reference_images for character consistency in bridge clips
    if (subjectReferenceImages && subjectReferenceImages.length > 0) {
      input.reference_images = subjectReferenceImages;
    }

    const prediction = await replicate.predictions.create({
      model: modelId as `${string}/${string}`,
      input,
    });

    // Poll for result
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 120;

    while (
      result.status !== 'succeeded' &&
      result.status !== 'failed' &&
      result.status !== 'canceled' &&
      attempts < maxAttempts
    ) {
      await new Promise((r) => setTimeout(r, 3000));
      result = await replicate.predictions.get(result.id);
      attempts++;
    }

    // Early exit on terminal failure states
    if (result.status === 'failed' || result.status === 'canceled') {
      return null;
    }

    if (result.status !== 'succeeded' || !result.output) return null;

    const videoUrl = Array.isArray(result.output) ? result.output[0] : String(result.output);

    // Download the bridge video
    const res = await fetch(videoUrl);
    if (!res.ok) return null;

    const videoBuffer = Buffer.from(await res.arrayBuffer());
    const bridgeVideoPath = join(workDir, `bridge-${randomUUID().slice(0, 8)}.mp4`);
    await writeFile(bridgeVideoPath, videoBuffer);

    return {
      clipIndex: -1, // caller sets this
      videoPath: bridgeVideoPath,
      durationSeconds: 2,
    };
  } catch {
    return null;
  }
}

// ─── Full Continuity Fix Pipeline ───────────────────────────────────

export interface ContinuityFixResult {
  originalClipPaths: string[];
  fixedClipPaths: string[];       // includes bridge clips inserted
  gapsDetected: number;
  gapsFixed: number;
  gapsSkipped: number;
  details: {
    clipIndex: number;
    ssim: number;
    severity: string;
    fixed: boolean;
    bridgePath?: string;
  }[];
}

/**
 * Full pipeline: detect gaps → generate bridges → return augmented clip list.
 *
 * @param clipPaths - Downloaded clip file paths in order
 * @param workDir - Temp directory for intermediate files
 * @param replicateToken - API token for AI generation
 * @param options - Configuration options
 */
export async function fixContinuityGaps(
  clipPaths: string[],
  workDir: string,
  replicateToken: string,
  options: {
    maxBridges?: number;        // max bridge clips to generate (cost control)
    videoModelId?: string;       // video model for bridge clips
    subjectReferenceImages?: string[]; // character face lock for bridge clips
    onProgress?: (msg: string) => void;
  } = {},
): Promise<ContinuityFixResult> {
  const { maxBridges = 5, videoModelId, subjectReferenceImages, onProgress } = options;

  const result: ContinuityFixResult = {
    originalClipPaths: [...clipPaths],
    fixedClipPaths: [...clipPaths],
    gapsDetected: 0,
    gapsFixed: 0,
    gapsSkipped: 0,
    details: [],
  };

  if (clipPaths.length < 2) return result;

  // Step 1: Detect all continuity gaps
  onProgress?.('Analyzing frame continuity...');
  const gaps = await detectContinuityGaps(clipPaths, workDir);
  result.gapsDetected = gaps.length;

  if (gaps.length === 0) {
    onProgress?.('All clips have good continuity');
    return result;
  }

  onProgress?.(`Found ${gaps.length} continuity gap${gaps.length > 1 ? 's' : ''}`);

  // Step 2: Sort by severity (fix worst gaps first within budget)
  const sortedGaps = [...gaps].sort((a, b) => a.ssim - b.ssim);
  const gapsToFix = sortedGaps.slice(0, maxBridges);
  const gapsToSkip = sortedGaps.slice(maxBridges);

  result.gapsSkipped = gapsToSkip.length;

  // Clean up skipped gap frames
  for (const gap of gapsToSkip) {
    unlink(gap.lastFramePath).catch(() => {});
    unlink(gap.firstFramePath).catch(() => {});
    result.details.push({
      clipIndex: gap.clipIndex,
      ssim: gap.ssim,
      severity: gap.severity,
      fixed: false,
    });
  }

  // Step 3: Generate bridge clips for each gap (in clip order for correct insertion)
  // Total timeout of 10 minutes — return partial results if exceeded
  const TOTAL_TIMEOUT_MS = 10 * 60 * 1000;
  const startTime = Date.now();
  const bridgesByIndex = new Map<number, string>();

  // Process in clip order so insertion offsets are predictable
  const gapsInOrder = gapsToFix.sort((a, b) => a.clipIndex - b.clipIndex);

  for (let i = 0; i < gapsInOrder.length; i++) {
    // Check total timeout before starting next gap
    if (Date.now() - startTime > TOTAL_TIMEOUT_MS) {
      onProgress?.(`Total timeout (10 min) reached after fixing ${i} of ${gapsInOrder.length} gaps. Returning partial results.`);
      // Mark remaining gaps as unfixed and clean up their frames
      for (let j = i; j < gapsInOrder.length; j++) {
        result.details.push({
          clipIndex: gapsInOrder[j].clipIndex,
          ssim: gapsInOrder[j].ssim,
          severity: gapsInOrder[j].severity,
          fixed: false,
        });
        unlink(gapsInOrder[j].lastFramePath).catch(() => {});
        unlink(gapsInOrder[j].firstFramePath).catch(() => {});
      }
      result.gapsSkipped += gapsInOrder.length - i;
      break;
    }

    const gap = gapsInOrder[i];
    onProgress?.(
      `Fixing gap ${i + 1}/${gapsInOrder.length} between clips ${gap.clipIndex + 1}–${gap.clipIndex + 2} (SSIM: ${gap.ssim.toFixed(3)})...`
    );

    const bridge = await generateBridgeVideo(
      gap.lastFramePath,
      gap.firstFramePath,
      workDir,
      replicateToken,
      videoModelId,
      subjectReferenceImages,
    );

    if (bridge) {
      bridge.clipIndex = gap.clipIndex;
      bridgesByIndex.set(gap.clipIndex, bridge.videoPath);
      result.gapsFixed++;
      result.details.push({
        clipIndex: gap.clipIndex,
        ssim: gap.ssim,
        severity: gap.severity,
        fixed: true,
        bridgePath: bridge.videoPath,
      });
    } else {
      result.details.push({
        clipIndex: gap.clipIndex,
        ssim: gap.ssim,
        severity: gap.severity,
        fixed: false,
      });
    }

    // Clean up frame files
    unlink(gap.lastFramePath).catch(() => {});
    unlink(gap.firstFramePath).catch(() => {});
  }

  // Step 4: Build augmented clip list with bridge clips inserted
  const augmented: string[] = [];
  for (let i = 0; i < clipPaths.length; i++) {
    augmented.push(clipPaths[i]);
    const bridgePath = bridgesByIndex.get(i);
    if (bridgePath) {
      augmented.push(bridgePath);
    }
  }
  result.fixedClipPaths = augmented;

  onProgress?.(
    `Continuity fix complete: ${result.gapsFixed}/${result.gapsDetected} gaps resolved`
  );

  return result;
}
