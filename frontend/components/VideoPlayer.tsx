'use client';

import { useEffect, useRef, useState } from 'react';
import { contentProgressApi, VideoProgressData } from '@/lib/api/contentProgress';

interface VideoPlayerProps {
  src: string;
  title: string;
  contentId: string;
  courseId: string;
  onComplete?: () => void;
  className?: string;
}

export default function VideoPlayer({
  src,
  title,
  contentId,
  courseId,
  onComplete,
  className = 'w-full h-full',
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedPosition, setSavedPosition] = useState<number | null>(null);
  const lastProgressPercentage = useRef<number>(0); // Track last saved progress percentage

  // Load saved progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const response = await contentProgressApi.getContentProgress(contentId);
        if (response.success && response.data?.lastPosition) {
          setSavedPosition(response.data.lastPosition);
        }
      } catch (error) {
        console.error('Error loading video progress:', error);
      }
    };

    loadProgress();
  }, [contentId]);

  // Set video position when loaded
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setIsLoading(false);
      if (savedPosition !== null && savedPosition > 0) {
        video.currentTime = savedPosition;
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [savedPosition]);

  // Initialize last progress percentage from saved position
  useEffect(() => {
    const video = videoRef.current;
    if (!video || savedPosition === null) return;

    const handleLoadedMetadata = async () => {
      if (video.duration > 0 && savedPosition > 0) {
        const savedPercentage = (savedPosition / video.duration) * 100;
        lastProgressPercentage.current = Math.floor(savedPercentage / 5) * 5; // Round to nearest 5%
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [savedPosition]);

  // Handle video end
  const handleEnded = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      lastProgressPercentage.current = 100;
      await contentProgressApi.updateVideoProgress({
        contentId,
        courseId,
        currentTime: video.duration,
        duration: video.duration,
        completed: true,
      });

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error marking video as completed:', error);
    }
  };

  // Update progress every 5% of video watched
  const handleTimeUpdate = async () => {
    const video = videoRef.current;
    if (!video) return;

    const currentTime = video.currentTime;
    const duration = video.duration;

    if (duration > 0 && currentTime > 0) {
      // Calculate current progress percentage
      const currentPercentage = (currentTime / duration) * 100;
      const currentPercentageRounded = Math.floor(currentPercentage / 5) * 5; // Round to nearest 5%

      // Update if progress increased by at least 5%
      if (currentPercentageRounded > lastProgressPercentage.current) {
        lastProgressPercentage.current = currentPercentageRounded;

        try {
          await contentProgressApi.updateVideoProgress({
            contentId,
            courseId,
            currentTime,
            duration,
            completed: false,
          });
          console.log(`[VideoProgress] Updated: ${currentPercentageRounded}% (${currentTime.toFixed(1)}s / ${duration.toFixed(1)}s)`);
        } catch (error) {
          console.error('Error updating video progress:', error);
        }
      }
    }
  };

  return (
    <div className={className}>
      <video
        ref={videoRef}
        src={src}
        controls
        className="w-full h-full"
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}
        preload="metadata"
      >
        <source src={src} type="video/mp4" />
        <source src={src} type="video/webm" />
        <source src={src} type="video/ogg" />
        เบราว์เซอร์ของคุณไม่รองรับการเล่นวิดีโอ
      </video>
      {isLoading && savedPosition !== null && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm">กำลังโหลดวิดีโอ...</p>
          </div>
        </div>
      )}
    </div>
  );
}
