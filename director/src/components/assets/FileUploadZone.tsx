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
          ? 'border-[#c6bfff] bg-[#1f1f24]'
          : 'border-[#c6bfff]/10 hover:border-[#c6bfff]/30'
      }`}
    >
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <span className="material-symbols-outlined animate-pulse text-4xl text-[#c6bfff]">
            cloud_upload
          </span>
          <p className="animate-pulse text-sm text-[#c6bfff]">Uploading...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-4xl text-[#928f9f]">
            upload_file
          </span>
          <p className="text-sm text-[#c8c4d6]">
            Drop files here or click to upload
          </p>
          <p className="text-xs text-[#928f9f]">
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
