'use client';

import { useState, useRef, useCallback } from 'react';
import { fileUploadService, formatFileSize, ALLOWED_MEDICAL_TYPES, MAX_FILE_SIZE } from '@/lib/file-upload';
import { logger } from '@/lib/logger';
import { analytics } from '@/lib/analytics';

interface UploadedFile {
  id: string;
  file: File;
  url?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface FileUploadProps {
  folder?: string;
  maxFiles?: number;
  onUploadComplete?: (files: Array<{ url: string; name: string }>) => void;
}

export default function FileUpload({
  folder = 'medical-documents',
  maxFiles = 5,
  onUploadComplete,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${formatFileSize(MAX_FILE_SIZE)}`;
    }

    if (!ALLOWED_MEDICAL_TYPES.includes(file.type)) {
      return 'File type not allowed';
    }

    return null;
  };

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);

      // Check max files limit
      if (files.length + fileArray.length > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const uploadedFiles: UploadedFile[] = fileArray.map((file) => {
        const error = validateFile(file);

        return {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          progress: 0,
          status: error ? 'error' : 'pending',
          error: error || undefined,
        };
      });

      setFiles((prev) => [...prev, ...uploadedFiles]);

      // Start uploading valid files
      uploadedFiles.forEach((uploadedFile) => {
        if (uploadedFile.status === 'pending') {
          uploadFile(uploadedFile);
        }
      });
    },
    [files.length, maxFiles]
  );

  const uploadFile = async (uploadedFile: UploadedFile) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === uploadedFile.id ? { ...f, status: 'uploading', progress: 0 } : f
      )
    );

    try {
      // Simulate progress (in real implementation, use XMLHttpRequest or fetch with progress)
      const progressInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id && f.progress < 90
              ? { ...f, progress: f.progress + 10 }
              : f
          )
        );
      }, 200);

      const result = await fileUploadService.uploadFile(uploadedFile.file, {
        folder,
        maxSize: MAX_FILE_SIZE,
        allowedTypes: ALLOWED_MEDICAL_TYPES,
      });

      clearInterval(progressInterval);

      if (result.success) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id
              ? { ...f, status: 'success', progress: 100, url: result.url }
              : f
          )
        );

        analytics.trackFileUpload(uploadedFile.file.type, uploadedFile.file.size);
        logger.info('File uploaded successfully', {
          fileName: uploadedFile.file.name,
          url: result.url,
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id
            ? { ...f, status: 'error', error: errorMessage }
            : f
        )
      );

      logger.error('File upload failed', error as Error, {
        fileName: uploadedFile.file.name,
      });
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      e.target.value = ''; // Reset input
    }
  };

  const handleComplete = () => {
    const successfulUploads = files
      .filter((f) => f.status === 'success' && f.url)
      .map((f) => ({ url: f.url!, name: f.file.name }));

    if (onUploadComplete && successfulUploads.length > 0) {
      onUploadComplete(successfulUploads);
    }

    setFiles([]);
  };

  const successCount = files.filter((f) => f.status === 'success').length;
  const uploadingCount = files.filter((f) => f.status === 'uploading').length;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <div className="text-6xl mb-4">📎</div>
        <p className="text-lg font-medium text-gray-700 mb-2">
          Drag & drop files here
        </p>
        <p className="text-sm text-gray-500 mb-4">
          or click to browse
        </p>
        <p className="text-xs text-gray-400">
          Allowed: PDF, JPEG, PNG, DOCX • Max size: {formatFileSize(MAX_FILE_SIZE)} • Max {maxFiles} files
        </p>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_MEDICAL_TYPES.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">
            Files ({successCount}/{files.length})
          </h3>

          {files.map((file) => (
            <div
              key={file.id}
              className="bg-white border rounded-lg p-4 flex items-center gap-4"
            >
              {/* Icon */}
              <div className="text-3xl">
                {file.status === 'success' && '✅'}
                {file.status === 'error' && '❌'}
                {file.status === 'uploading' && '⏳'}
                {file.status === 'pending' && '📄'}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">
                  {file.file.name}
                </p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(file.file.size)}
                </p>

                {/* Progress Bar */}
                {file.status === 'uploading' && (
                  <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}

                {/* Error Message */}
                {file.error && (
                  <p className="mt-1 text-sm text-red-600">{file.error}</p>
                )}

                {/* Success URL */}
                {file.url && (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-sm text-blue-600 hover:underline"
                  >
                    View file
                  </a>
                )}
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeFile(file.id)}
                className="text-gray-400 hover:text-red-600 transition-colors"
                title="Remove"
              >
                <span className="text-xl">🗑️</span>
              </button>
            </div>
          ))}

          {/* Actions */}
          {successCount > 0 && (
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleComplete}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Complete Upload ({successCount} file{successCount > 1 ? 's' : ''})
              </button>
              <button
                onClick={() => setFiles([])}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}

      {/* Uploading Status */}
      {uploadingCount > 0 && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Uploading {uploadingCount} file{uploadingCount > 1 ? 's' : ''}...
          </p>
        </div>
      )}
    </div>
  );
}
