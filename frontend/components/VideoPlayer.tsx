'use client';

import { useEffect, useRef, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface VideoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  videoUrl?: string;
  fileUrl?: string;
  onComplete?: () => void;
}

export default function VideoPlayer({
  isOpen,
  onClose,
  title,
  videoUrl,
  fileUrl,
  onComplete,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isYouTube, setIsYouTube] = useState(false);
  const [isVimeo, setIsVimeo] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');
  const [actualVideoUrl, setActualVideoUrl] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    // ตรวจสอบว่าเป็น YouTube หรือ Vimeo
    if (videoUrl) {
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
      
      const youtubeMatch = videoUrl.match(youtubeRegex);
      const vimeoMatch = videoUrl.match(vimeoRegex);

      if (youtubeMatch) {
        setIsYouTube(true);
        setIsVimeo(false);
        const videoId = youtubeMatch[1];
        setEmbedUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`);
        setActualVideoUrl('');
      } else if (vimeoMatch) {
        setIsYouTube(false);
        setIsVimeo(true);
        const videoId = vimeoMatch[1];
        setEmbedUrl(`https://player.vimeo.com/video/${videoId}?autoplay=1`);
        setActualVideoUrl('');
      } else {
        setIsYouTube(false);
        setIsVimeo(false);
        setEmbedUrl('');
        setActualVideoUrl(videoUrl);
      }
    } else if (fileUrl) {
      // ไฟล์วิดีโอที่อัพโหลด
      setIsYouTube(false);
      setIsVimeo(false);
      setEmbedUrl('');
      
      // แปลง fileUrl ให้เป็น full URL ถ้าเป็น relative path
      let fullUrl = fileUrl;
      if (fileUrl.startsWith('/uploads/')) {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const baseUrl = apiBaseUrl.replace('/api', '');
        fullUrl = `${baseUrl}${fileUrl}`;
      }
      setActualVideoUrl(fullUrl);
    }
  }, [isOpen, videoUrl, fileUrl]);

  const handleVideoEnd = () => {
    if (onComplete) {
      onComplete();
    }
  };

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative w-full max-w-6xl mx-4 bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Video Player */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <div className="absolute inset-0 bg-black">
            {isYouTube || isVimeo ? (
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={title}
              />
            ) : actualVideoUrl ? (
              <video
                ref={videoRef}
                src={actualVideoUrl}
                controls
                className="w-full h-full"
                onEnded={handleVideoEnd}
                autoPlay
              >
                <source src={actualVideoUrl} type="video/mp4" />
                <source src={actualVideoUrl} type="video/webm" />
                <source src={actualVideoUrl} type="video/ogg" />
                เบราว์เซอร์ของคุณไม่รองรับการเล่นวิดีโอ
              </video>
            ) : (
              <div className="flex items-center justify-center w-full h-full text-white">
                <p>ไม่พบวิดีโอ</p>
              </div>
            )}
          </div>
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


