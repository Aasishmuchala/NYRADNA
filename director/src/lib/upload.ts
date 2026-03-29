import JSZip from 'jszip';
import Replicate from 'replicate';

export async function createTrainingZip(files: File[]): Promise<Uint8Array> {
  const zip = new JSZip();
  // Limit total upload size to 500MB
  const MAX_TOTAL_BYTES = 500 * 1024 * 1024;
  let totalBytes = 0;

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    totalBytes += arrayBuffer.byteLength;
    if (totalBytes > MAX_TOTAL_BYTES) {
      throw new Error(`Total file size exceeds 500MB limit`);
    }
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

  const blob = new Blob([zipData as BlobPart], { type: 'application/zip' });
  const file = await replicate.files.create(blob, { filename });

  return file.urls.get;
}
