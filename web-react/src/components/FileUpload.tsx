import { useState, useCallback, useRef, DragEvent, ChangeEvent } from 'react';
import './FileUpload.css';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const CHUNK_SIZE = 200 * 1024; // 200KB per chunk

interface FileUploadProps {
  sessionId: string | null;
  onUpload: (sessionId: string, file: File) => Promise<void>;
  disabled?: boolean;
}

interface UploadProgress {
  filename: string;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  error?: string;
}

export function FileUpload({ sessionId, onUpload, disabled }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && sessionId) {
      setIsDragging(true);
    }
  }, [disabled, sessionId]);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (!sessionId) {
      alert('Please select a session first');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      return;
    }

    setUploads(prev => [...prev, {
      filename: file.name,
      progress: 0,
      status: 'uploading'
    }]);

    try {
      await onUpload(sessionId, file);
      setUploads(prev => prev.map(u =>
        u.filename === file.name ? { ...u, progress: 100, status: 'complete' } : u
      ));

      // Auto-remove completed uploads after 3 seconds
      setTimeout(() => {
        setUploads(prev => prev.filter(u => u.filename !== file.name || u.status !== 'complete'));
      }, 3000);
    } catch (error) {
      setUploads(prev => prev.map(u =>
        u.filename === file.name ? {
          ...u,
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed'
        } : u
      ));
    }
  }, [sessionId, onUpload]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || !sessionId) return;

    const files = Array.from(e.dataTransfer.files);
    files.forEach(processFile);
  }, [disabled, sessionId, processFile]);

  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || disabled || !sessionId) return;

    const files = Array.from(e.target.files);
    files.forEach(processFile);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [disabled, sessionId, processFile]);

  const handleClick = useCallback(() => {
    if (!disabled && sessionId) {
      fileInputRef.current?.click();
    }
  }, [disabled, sessionId]);

  return (
    <div className="file-upload-container">
      <div
        className={`file-upload-dropzone ${isDragging ? 'dragging' : ''} ${disabled || !sessionId ? 'disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <div className="upload-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div className="upload-text">
          {!sessionId ? (
            <span>Select a session to upload files</span>
          ) : isDragging ? (
            <span>Drop files here</span>
          ) : (
            <>
              <span>Drag & drop files or click to select</span>
              <span className="upload-hint">Max {MAX_FILE_SIZE / 1024 / 1024}MB per file</span>
            </>
          )}
        </div>
      </div>

      {uploads.length > 0 && (
        <div className="upload-list">
          {uploads.map((upload, index) => (
            <div key={`${upload.filename}-${index}`} className={`upload-item ${upload.status}`}>
              <div className="upload-filename">{upload.filename}</div>
              {upload.status === 'uploading' && (
                <div className="upload-progress-bar">
                  <div
                    className="upload-progress-fill"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}
              {upload.status === 'complete' && (
                <span className="upload-status-icon success">✓</span>
              )}
              {upload.status === 'error' && (
                <span className="upload-status-icon error" title={upload.error}>✕</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Utility function to convert file to base64 chunks
export async function fileToBase64Chunks(file: File): Promise<{ chunk: string; index: number; total: number }[]> {
  const chunks: { chunk: string; index: number; total: number }[] = [];
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const slice = file.slice(start, end);

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:application/octet-stream;base64,")
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(slice);
    });

    chunks.push({ chunk: base64, index: i, total: totalChunks });
  }

  return chunks;
}
