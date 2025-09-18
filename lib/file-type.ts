export type FileType = 'image' | 'pdf' | 'video' | 'audio' | 'unknown';

// Keep mappings aligned with the original component logic
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

const getFileTypeFromMimeType = (mimeType?: string): FileType | null => {
  if (!mimeType) return null;
  for (const [mime, type] of Object.entries(MIME_TYPE_MAP)) {
    if (mimeType.includes(mime)) return type;
  }
  return null;
};

const getFileTypeFromUrl = (url?: string): FileType | null => {
  if (!url) return null;
  const extension = url.split('.').pop()?.toLowerCase();
  if (!extension) return null;
  return FILE_EXTENSIONS[extension] || null;
};

const getFileTypeFromUrlPatterns = (url?: string): FileType | null => {
  if (!url) return null;
  if (url.includes('pdf')) return 'pdf';
  if (url.includes('video') || url.includes('mp4')) return 'video';
  if (url.includes('audio') || url.includes('mp3')) return 'audio';
  return null;
};

export const determineFileType = (
  metadata: { type?: string } | null,
  url: string,
  endpoint: string
): FileType => {
  // Priority 1: Use metadata MIME type
  const typeFromMime = getFileTypeFromMimeType(metadata?.type);
  if (typeFromMime) return typeFromMime;

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

