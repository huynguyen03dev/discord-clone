'use client'

import { FileIcon, X } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';

import { UploadDropzone } from "@/lib/uploadthing";

import "@uploadthing/react/styles.css"

// Types
type FileType = 'image' | 'pdf' | 'video' | 'audio' | 'unknown';

interface FileMetadata {
  name: string;
  type: string;
  size: number;
}

interface FileUploadProps {
  onChange: (url?: string) => void;
  value: string;
  endpoint: "messageFile" | "serverImage";
}

interface FileDisplayProps {
  value: string;
  fileName: string;
  onRemove: () => void;
}

// Constants
const MIME_TYPE_MAP: Record<string, FileType> = {
  'application/pdf': 'pdf',
  'video/': 'video',
  'audio/': 'audio',
  'image/': 'image',
};

const FILE_EXTENSIONS: Record<string, FileType> = {
  // PDF
  pdf: 'pdf',
  // Video
  mp4: 'video',
  webm: 'video',
  ogg: 'video',
  mov: 'video',
  avi: 'video',
  // Audio
  mp3: 'audio',
  wav: 'audio',
  m4a: 'audio',
  aac: 'audio',
  // Images
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
};

// Utility Functions
const getFileTypeFromMimeType = (mimeType: string): FileType | null => {
  for (const [mime, type] of Object.entries(MIME_TYPE_MAP)) {
    if (mimeType.includes(mime)) return type;
  }
  return null;
};

const getFileTypeFromUrl = (url: string): FileType | null => {
  if (!url) return null;

  const extension = url.split('.').pop()?.toLowerCase();
  if (!extension) return null;

  return FILE_EXTENSIONS[extension] || null;
};

const getFileTypeFromUrlPatterns = (url: string): FileType | null => {
  if (url.includes('pdf')) return 'pdf';
  if (url.includes('video') || url.includes('mp4')) return 'video';
  if (url.includes('audio') || url.includes('mp3')) return 'audio';
  return null;
};

const determineFileType = (
  metadata: FileMetadata | null,
  url: string,
  endpoint: string
): FileType => {
  // Priority 1: Use metadata MIME type
  if (metadata?.type) {
    const typeFromMime = getFileTypeFromMimeType(metadata.type);
    if (typeFromMime) return typeFromMime;
  }

  // Priority 2: Use URL extension
  const typeFromUrl = getFileTypeFromUrl(url);
  if (typeFromUrl) return typeFromUrl;

  // Priority 3: Use URL patterns
  const typeFromPatterns = getFileTypeFromUrlPatterns(url);
  if (typeFromPatterns) return typeFromPatterns;

  // Priority 4: Endpoint-based fallback
  if (endpoint === 'serverImage') return 'image';

  return 'unknown';
};

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

const ImageDisplay = ({ value, onRemove }: FileDisplayProps) => (
  <div className="relative h-20 w-20">
    <Image
      fill
      src={value}
      alt="Uploaded image"
      className="rounded-full object-cover"
    />
    <RemoveButton onClick={onRemove} />
  </div>
);

const FileDisplay = ({ value, fileName, onRemove }: FileDisplayProps) => (
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

const FileUpload = ({ onChange, endpoint, value }: FileUploadProps) => {
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

  // Display uploaded file based on type
  if (value && fileType === 'image') {
    return <ImageDisplay value={value} fileName={fileName} onRemove={handleRemove} />;
  }

  if (value && (fileType === 'pdf' || fileType === 'video' || fileType === 'audio')) {
    return <FileDisplay value={value} fileName={fileName} onRemove={handleRemove} />;
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

export default FileUpload;