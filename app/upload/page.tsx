'use client';

import FileUpload from '@/components/FileUpload';
import { useState } from 'react';

export default function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; name: string }>>([]);

  const handleUploadComplete = (files: Array<{ url: string; name: string }>) => {
    setUploadedFiles((prev) => [...prev, ...files]);
    alert(`${files.length} file(s) uploaded successfully!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload Medical Documents
          </h1>
          <p className="text-gray-600">
            Upload your medical records, test results, or prescriptions
          </p>
        </div>

        <FileUpload
          folder="patient-documents"
          maxFiles={5}
          onUploadComplete={handleUploadComplete}
        />

        {uploadedFiles.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Uploaded Files ({uploadedFiles.length})
            </h2>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
