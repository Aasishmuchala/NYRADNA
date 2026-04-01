import { NextRequest, NextResponse } from 'next/server';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(req: NextRequest) {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'REPLICATE_API_TOKEN is not configured' },
        { status: 400 },
      );
    }

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type must be multipart/form-data' },
        { status: 400 },
      );
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'file field is required and must be a file upload' },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 },
      );
    }

    // Validate file type (only accept PNG/JPEG images)
    const mimeType = file.type;
    if (!mimeType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are accepted' },
        { status: 400 },
      );
    }

    const Replicate = (await import('replicate')).default;
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    // Convert blob to a File object for Replicate upload
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file instanceof File ? file.name : 'control-image.png';

    const replicateFile = await replicate.files.create(
      new Blob([buffer], { type: mimeType }),
      {
        filename: fileName,
        content_type: mimeType,
      },
    );

    const url = replicateFile.urls?.get ?? '';

    console.log(`[/api/upload-control] uploaded file=${fileName} size=${file.size} url=${url}`);
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'File upload failed';
    const stack = error instanceof Error ? error.stack : '';
    console.error(`[/api/upload-control] Error: ${message}\n${stack}`);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
