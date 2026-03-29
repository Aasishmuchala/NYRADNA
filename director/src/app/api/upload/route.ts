import { NextRequest, NextResponse } from 'next/server';
import { createTrainingZip, uploadToReplicate } from '@/lib/upload';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files: File[] = [];

    for (const [, value] of formData.entries()) {
      if (value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const zipBuffer = await createTrainingZip(files);
    const zipUrl = await uploadToReplicate(zipBuffer);

    return NextResponse.json({ zipUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
