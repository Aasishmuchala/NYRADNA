'use client';

import { useRef, useState } from 'react';

interface FileUploadZoneProps {
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
  accept?: string;
}

export default function FileUploadZone({
  onUpload,
  uploading,
  accept = 'image/*,video/*,audio/*',
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      onUpload(file);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
    // Reset input so the same file can be re-selected
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
        isDragOver
          ? 'border-[#7F72F7] bg-[#1A1A2E]'
          : 'border-[#7F72F7]/10 hover:border-[#7F72F7]/30'
      }`}
    >
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <span className="material-symbols-outlined animate-pulse text-4xl text-[#7F72F7]">
            cloud_upload
          </span>
          <p className="animate-pulse text-sm text-[#7F72F7]">Uploading...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-4xl text-[#6B6B80]">
            upload_file
          </span>
          <p className="text-sm text-[#A0A0B8]">
            Drop files here or click to upload
          </p>
          <p className="text-xs text-[#6B6B80]">
            Images, videos, and audio files accepted
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
