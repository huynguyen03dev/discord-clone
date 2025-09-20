'use client'

import { FileIcon, X } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';

import { UploadDropzone } from "@/lib/uploadthing";

import "@uploadthing/react/styles.css"

// Local file-type detection (moved from lib/file-type)
export type FileType = 'image' | 'pdf' | 'video' | 'audio' | 'unknown';

const EXTENSIONS: Record<FileType, string[]> = {
  pdf: ['pdf'],
  video: ['mp4', 'webm', 'ogg', 'mov', 'avi'],
  audio: ['mp3', 'wav', 'm4a', 'aac'],
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  unknown: [],
};

const FILE_EXTENSIONS: Record<string, FileType> = Object.entries(EXTENSIONS).reduce((acc, [type, list]) => {
  (list as string[]).forEach((ext) => { acc[ext] = type as FileType; });
  return acc;
}, {} as Record<string, FileType>);

const determineFileType = (
  metadata: { type?: string } | null,
  url: string,
  endpoint: string
): FileType => {
  const mime = metadata?.type?.toLowerCase();
  if (mime) {
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime === 'application/pdf' || mime.endsWith('/pdf')) return 'pdf';
  }

  const ext = url?.split('.').pop()?.toLowerCase();
  if (ext && FILE_EXTENSIONS[ext]) return FILE_EXTENSIONS[ext];

  const u = url || '';
  if (u.includes('pdf')) return 'pdf';
  if (u.includes('video') || u.includes('mp4')) return 'video';
  if (u.includes('audio') || u.includes('mp3')) return 'audio';

  if (endpoint === 'serverImage') return 'image';
  return 'unknown';
};

interface FileMetadata {
  name: string;
  type: string;
  size: number;
}

interface FileUploadProps {
  onChange: (url?: string) => void;
  value: string;
  endpoint: "messageFile" | "serverImage";
  onUploadInfo?: (info: { fileName: string; fileMimeType: string; fileSize: number }) => void;
}



const getDisplayFileName = (metadata: FileMetadata | null, url: string, fileType: FileType): string => {
  if (metadata?.name) return metadata.name;

  const urlFileName = url.split('/').pop();
  if (urlFileName && urlFileName.includes('.')) return urlFileName;

  // Fallback names
  const fallbackNames: Record<FileType, string> = {
    pdf: 'PDF File',
    video: 'Video File',
    audio: 'Audio File',
    image: 'Image File',
    unknown: 'Unknown File',
  };

  return fallbackNames[fileType];
};

const FileUpload = ({ onChange, endpoint, value, onUploadInfo }: FileUploadProps) => {
  // State management
  const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset metadata and error when value changes
  useEffect(() => {
    if (!value) {
      setFileMetadata(null);
      setError(null);
    }
  }, [value]);

  // Determine file type and display name
  const fileType = determineFileType(fileMetadata, value, endpoint);
  const fileName = getDisplayFileName(fileMetadata, value, fileType);

  // Handle file removal
  const handleRemove = () => {
    onChange("");
    setFileMetadata(null);
    setError(null);
  };

  // Handle retry after error
  const handleRetry = () => {
    setError(null);
  };

  // Show error state
  if (error) {
    return <ErrorDisplay error={error} onRetry={handleRetry} />;
  }

  // Display uploaded file (single preview component)
  if (value) {
    return (
      <AttachmentPreview
        value={value}
        fileName={fileName}
        fileType={fileType}
        onRemove={handleRemove}
      />
    );
  }

  // Upload dropzone (when no file is uploaded)
  return (
    <UploadDropzone
      endpoint={endpoint}
      onClientUploadComplete={(res) => {
        try {
          console.log("[UPLOAD_COMPLETE]", res?.[0]);

          const file = res?.[0];
          if (!file) {
            throw new Error("No file received from upload");
          }

          // Validate required properties
          const fileUrl = (file as any)?.ufsUrl || (file as any)?.url;
          if (!fileUrl) {
            throw new Error("No file URL received");
          }

          // Store file metadata with validation
          const metadata: FileMetadata = {
            name: (file as any)?.name || 'Unknown File',
            type: (file as any)?.type || 'application/octet-stream',
            size: (file as any)?.size || 0,
          };

          setFileMetadata(metadata);
          setError(null);
          onChange(fileUrl);
          onUploadInfo?.({
            fileName: metadata.name,
            fileMimeType: metadata.type,
            fileSize: metadata.size,
          });

        } catch (err) {
          console.error("[UPLOAD_COMPLETE_ERROR]", err);
          setError(err instanceof Error ? err.message : "Upload processing failed");
        }
      }}
      onUploadError={(error: Error) => {
        console.error("[UPLOAD_ERROR]", error);
        setError(error.message || "Upload failed");
        setFileMetadata(null);
      }}
    />
  );
}


// Reusable Components
const RemoveButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="bg-rose-500 text-white p-1 rounded-full absolute -top-2 -right-2 shadow-sm hover:bg-rose-600 transition-colors"
    type="button"
    aria-label="Remove file"
  >
    <X className="h-4 w-4" />
  </button>
);

const AttachmentPreview = ({ value, fileName, fileType, onRemove }: { value: string; fileName: string; fileType: FileType; onRemove: () => void; }) => {
  if (fileType === 'image') {
    return (
      <div className="relative h-20 w-20">
        <Image
          fill
          src={value}
          alt={fileName || "Uploaded image"}
          className="rounded-full object-cover"
        />
        <RemoveButton onClick={onRemove} />
      </div>
    );
  }
  return (
    <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10 border border-border/50">
      <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-400 flex-shrink-0" />
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline truncate flex-1 min-w-0"
        title={fileName}
      >
        {fileName}
      </a>
      <RemoveButton onClick={onRemove} />
    </div>
  );
};

const ErrorDisplay = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="p-4 border border-red-200 rounded-md bg-red-50 dark:bg-red-900/20">
    <p className="text-sm text-red-600 dark:text-red-400 mb-2">
      Upload Error: {error}
    </p>
    <button
      onClick={onRetry}
      className="text-xs text-red-700 dark:text-red-300 hover:underline"
      type="button"
    >
      Try again
    </button>
  </div>
);
export default FileUpload;