'use client'

import { FileIcon, X } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';

import { UploadDropzone } from "@/lib/uploadthing";

import "@uploadthing/react/styles.css"
import { determineFileType, type FileType } from "@/lib/file-type";


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