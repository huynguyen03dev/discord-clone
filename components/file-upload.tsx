'use client'

import { FileIcon, X } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';

import { UploadDropzone } from "@/lib/uploadthing";

import "@uploadthing/react/styles.css"

interface FileUploadProps {
  onChange: (url?: string) => void;
  value: string;
  endpoint: "messageFile" | "serverImage";
}

const FileUpload = ({ onChange, endpoint, value }: FileUploadProps) => {
  // State to store file metadata from UploadThing
  const [fileMetadata, setFileMetadata] = useState<any>(null);

  // More robust file type detection using both URL and stored metadata
  const getFileType = (url: string, metadata?: any) => {
    if (!url) return null;

    // First, try to use stored metadata from UploadThing response
    if (metadata?.type) {
      if (metadata.type.includes('pdf')) return 'pdf';
      if (metadata.type.includes('video')) return 'video';
      if (metadata.type.includes('audio')) return 'audio';
      if (metadata.type.includes('image')) return 'image';
    }

    // Fallback: Extract file extension from URL
    const extension = url.split('.').pop()?.toLowerCase();

    // Check for PDF
    if (extension === 'pdf') return 'pdf';

    // Check for video formats
    if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(extension || '')) return 'video';

    // Check for audio formats
    if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(extension || '')) return 'audio';

    // Check for image formats
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) return 'image';

    // Additional fallback - check if URL contains type indicators
    if (url.includes('pdf')) return 'pdf';
    if (url.includes('video') || url.includes('mp4')) return 'video';
    if (url.includes('audio') || url.includes('mp3')) return 'audio';

    // If serverImage endpoint, assume it's an image
    if (endpoint === 'serverImage') return 'image';

    return 'unknown';
  };

  // Reset metadata when value changes to empty
  useEffect(() => {
    if (!value) {
      setFileMetadata(null);
    }
  }, [value]);

  const fileType = getFileType(value, fileMetadata);

  // Image display
  if (value && fileType === 'image') {
    return (
      <div className="relative h-20 w-20">
        <Image
          fill
          src={value}
          alt="Upload"
          className="rounded-full"
        />
        <button
          onClick={() => onChange("")}
          className="bg-rose-500 text-white p-1 rounded-full absolute top-0 right-0 shadow-sm"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // PDF display
  if (value && fileType === 'pdf') {
    const fileName = fileMetadata?.name || value.split('/').pop() || 'PDF File';

    return (
      <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
        <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-400" />
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline truncate"
        >
          {fileName}
        </a>
        <button
          onClick={() => onChange("")}
          className="bg-rose-500 text-white p-1 rounded-full absolute -top-2 -right-2 shadow-sm"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Video display (if you want to add video support)
  if (value && fileType === 'video') {
    const fileName = fileMetadata?.name || value.split('/').pop() || 'Video File';

    return (
      <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
        <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-400" />
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline truncate"
        >
          {fileName}
        </a>
        <button
          onClick={() => onChange("")}
          className="bg-rose-500 text-white p-1 rounded-full absolute -top-2 -right-2 shadow-sm"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Audio display (if you want to add audio support)
  if (value && fileType === 'audio') {
    const fileName = fileMetadata?.name || value.split('/').pop() || 'Audio File';

    return (
      <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
        <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-400" />
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline truncate"
        >
          {fileName}
        </a>
        <button
          onClick={() => onChange("")}
          className="bg-rose-500 text-white p-1 rounded-full absolute -top-2 -right-2 shadow-sm"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Upload dropzone (when no file is uploaded)
  return (
    <UploadDropzone
      endpoint={endpoint}
      onClientUploadComplete={(res) => {
        console.log("[UPLOAD_COMPLETE]", res?.[0]); // Debug log to see available properties
        const file = res?.[0] as any;

        // Store file metadata for type detection
        setFileMetadata({
          name: file?.name,
          type: file?.type,
          size: file?.size
        });

        onChange(file?.ufsUrl || file?.url); // Use ufsUrl first (recommended), fallback to url
      }}
      onUploadError={(error: Error) => {
        console.log("[UPLOAD_ERROR]", error);
      }}
    />
  );
}

export default FileUpload;