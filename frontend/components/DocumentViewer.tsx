'use client';

import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fileUrl?: string;
  fileName?: string;
  onComplete?: () => void;
}

export default function DocumentViewer({
  isOpen,
  onClose,
  title,
  fileUrl,
  fileName,
  onComplete,
}: DocumentViewerProps) {
  if (!isOpen) return null;

  // แปลง fileUrl ให้เป็น full URL ถ้าเป็น relative path
  let fullUrl = fileUrl;
  if (fileUrl && fileUrl.startsWith('/uploads/')) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const baseUrl = apiBaseUrl.replace('/api', '');
    fullUrl = `${baseUrl}${fileUrl}`;
  }

  const handleDownload = () => {
    if (fullUrl) {
      window.open(fullUrl, '_blank');
    }
  };

  const handleClose = () => {
    if (onComplete) {
      onComplete();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative w-full max-w-6xl mx-4 bg-white rounded-lg shadow-xl flex flex-col" style={{ height: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            {fileName && (
              <span className="text-sm text-gray-500">({fileName})</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {fullUrl && (
              <button
                onClick={handleDownload}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                title="ดาวน์โหลด"
              >
                <ArrowDownTrayIcon className="h-6 w-6" />
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Document Viewer */}
        <div className="flex-1 overflow-hidden">
          {fullUrl ? (
            <iframe
              src={fullUrl}
              className="w-full h-full"
              title={title}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-gray-600">
              <p>ไม่พบเอกสาร</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}


