import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import { validateUrl } from '@/lib/urlValidation';

/**
 * Extracts the last frame (or a specific frame) from a video URL.
 * Used for video extension/chaining — the last frame of clip N becomes
 * the start_image for clip N+1, ensuring visual continuity.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoUrl, position = 'last' } = body;

    if (!videoUrl) {
      return NextResponse.json({ error: 'videoUrl is required' }, { status: 400 });
    }

    const urlCheck = validateUrl(videoUrl, { trustedOnly: true });
    if (!urlCheck.valid) {
      return NextResponse.json({ error: `Invalid videoUrl: ${urlCheck.error}` }, { status: 400 });
    }

    const workDir = join(tmpdir(), `director-frame-${randomUUID()}`);
    await mkdir(workDir, { recursive: true });

    // Download video
    const videoPath = join(workDir, 'input.mp4');
    const res = await fetch(videoUrl);
    if (!res.ok) throw new Error('Failed to download video');
    const buffer = Buffer.from(await res.arrayBuffer());
    await writeFile(videoPath, buffer);

    // Get video duration
    const duration = await new Promise<number>((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) return reject(err);
        resolve(metadata.format.duration ?? 5);
      });
    });

    // Extract frame
    const framePath = join(workDir, 'frame.png');
    const seekTime = position === 'first' ? 0 :
                     position === 'middle' ? duration / 2 :
                     Math.max(0, duration - 0.1); // last frame

    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .seekInput(seekTime)
        .frames(1)
        .output(framePath)
        .on('end', () => resolve())
        .on('error', (e: Error) => reject(e))
        .run();
    });

    // Read frame and return as base64 data URL
    const frameBuffer = await readFile(framePath);
    const base64 = frameBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    // Cleanup
    unlink(videoPath).catch(() => {});
    unlink(framePath).catch(() => {});

    return NextResponse.json({
      frameUrl: dataUrl,
      duration,
      position: seekTime,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Frame extraction failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
