import JSZip from 'jszip';
import Replicate from 'replicate';

export async function createTrainingZip(files: File[]): Promise<Uint8Array> {
  const zip = new JSZip();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    zip.file(file.name, arrayBuffer);
  }

  const zipData = await zip.generateAsync({ type: 'uint8array' });
  return zipData;
}

export async function uploadToReplicate(zipData: Uint8Array, filename: string = 'training-images.zip'): Promise<string> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error('REPLICATE_API_TOKEN environment variable is not set');
  }

  const replicate = new Replicate({ auth: token });

  const blob = new Blob([zipData as unknown as BlobPart], { type: 'application/zip' });
  const file = await replicate.files.create(blob, { filename });

  return file.urls.get;
}
