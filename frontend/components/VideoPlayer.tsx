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
  const progressUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTime = useRef<number>(0);

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

  // Update progress periodically
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = async () => {
      const currentTime = video.currentTime;
      const duration = video.duration;

      if (duration > 0 && currentTime > 0) {
        // Only update if at least 5 seconds have passed since last update
        const now = Date.now();
        if (now - lastUpdateTime.current < 5000) return;
        lastUpdateTime.current = now;

        try {
          const progressData: VideoProgressData = {
            contentId,
            courseId,
            currentTime,
            duration,
            completed: false,
          };

          await contentProgressApi.updateVideoProgress(progressData);
        } catch (error) {
          console.error('Error updating video progress:', error);
        }
      }
    };

    // Update every 5 seconds
    progressUpdateInterval.current = setInterval(updateProgress, 5000);

    return () => {
      if (progressUpdateInterval.current) {
        clearInterval(progressUpdateInterval.current);
      }
    };
  }, [contentId, courseId]);

  // Handle video end
  const handleEnded = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
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

  // Update progress on timeupdate (for more frequent updates)
  const handleTimeUpdate = async () => {
    const video = videoRef.current;
    if (!video) return;

    const currentTime = video.currentTime;
    const duration = video.duration;

    // Update every 10 seconds of playback
    if (duration > 0 && Math.floor(currentTime) % 10 === 0) {
      const now = Date.now();
      if (now - lastUpdateTime.current < 10000) return;
      lastUpdateTime.current = now;

      try {
        await contentProgressApi.updateVideoProgress({
          contentId,
          courseId,
          currentTime,
          duration,
          completed: false,
        });
      } catch (error) {
        console.error('Error updating video progress:', error);
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
