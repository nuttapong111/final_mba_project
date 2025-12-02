'use client';

import { useEffect, useRef, useState } from 'react';
import { contentProgressApi, VideoProgressData } from '@/lib/api/contentProgress';

interface YouTubePlayerProps {
  videoId: string;
  title: string;
  contentId: string;
  courseId: string;
  onComplete?: () => void;
  className?: string;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function YouTubePlayer({
  videoId,
  title,
  contentId,
  courseId,
  onComplete,
  className = 'w-full h-full',
}: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedPosition, setSavedPosition] = useState<number | null>(null);
  const lastProgressPercentage = useRef<number>(0);
  const apiReadyRef = useRef<boolean>(false);
  const playerReadyRef = useRef<boolean>(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const response = await contentProgressApi.getContentProgress(contentId);
        if (response.success && response.data?.lastPosition) {
          setSavedPosition(response.data.lastPosition);
          const duration = response.data.progress > 0 ? (response.data.lastPosition / (response.data.progress / 100)) : null;
          if (duration && duration > 0) {
            const savedPercentage = (response.data.lastPosition / duration) * 100;
            lastProgressPercentage.current = Math.floor(savedPercentage / 5) * 5;
          }
        }
      } catch (error) {
        console.error('Error loading YouTube video progress:', error);
      }
    };

    loadProgress();
  }, [contentId]);

  // Load YouTube IFrame API
  useEffect(() => {
    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      apiReadyRef.current = true;
      initializePlayer();
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      // Wait for API to be ready
      const checkAPI = setInterval(() => {
        if (window.YT && window.YT.Player) {
          apiReadyRef.current = true;
          clearInterval(checkAPI);
          initializePlayer();
        }
      }, 100);
      return () => clearInterval(checkAPI);
    }

    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Set up callback
    window.onYouTubeIframeAPIReady = () => {
      apiReadyRef.current = true;
      initializePlayer();
    };
  }, []);

  const initializePlayer = () => {
    if (!apiReadyRef.current || !containerRef.current || playerReadyRef.current) return;

    try {
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (event: any) => {
            playerReadyRef.current = true;
            setIsLoading(false);
            
            // Seek to saved position if available
            if (savedPosition !== null && savedPosition > 0) {
              event.target.seekTo(savedPosition, true);
              console.log(`[YouTubePlayer] Seeking to ${savedPosition} seconds`);
            }

            // Set up progress tracking
            setupProgressTracking(event.target);
          },
          onStateChange: (event: any) => {
            // YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
            if (event.data === window.YT.PlayerState.ENDED) {
              handleVideoEnd();
            }
          },
          onError: (event: any) => {
            console.error('[YouTubePlayer] Error:', event.data);
            setIsLoading(false);
          },
        },
      });
    } catch (error) {
      console.error('[YouTubePlayer] Failed to initialize:', error);
      setIsLoading(false);
    }
  };

  const setupProgressTracking = (player: any) => {
    // Clear existing interval if any
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // Track progress every second
    progressIntervalRef.current = setInterval(async () => {
      if (!player || !player.getCurrentTime || !player.getDuration) {
        return;
      }

      try {
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();

        if (duration > 0 && currentTime > 0) {
          const currentPercentage = (currentTime / duration) * 100;
          const currentPercentageRounded = Math.floor(currentPercentage / 5) * 5;

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
              console.log(`[YouTubePlayer] Updated: ${currentPercentageRounded}% (${currentTime.toFixed(1)}s / ${duration.toFixed(1)}s)`);
            } catch (error) {
              console.error('Error updating YouTube video progress:', error);
            }
          }
        }
      } catch (error) {
        console.error('[YouTubePlayer] Error tracking progress:', error);
      }
    }, 1000); // Check every second
  };

  const handleVideoEnd = async () => {
    if (!playerRef.current) return;

    try {
      const duration = playerRef.current.getDuration();
      lastProgressPercentage.current = 100;
      
      await contentProgressApi.updateVideoProgress({
        contentId,
        courseId,
        currentTime: duration,
        duration: duration,
        completed: true,
      });

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error marking YouTube video as completed:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch (error) {
          console.error('[YouTubePlayer] Error destroying player:', error);
        }
      }
    };
  }, []);

  return (
    <div className={className} style={{ position: 'relative' }}>
      <div ref={containerRef} className="w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm">กำลังโหลดวิดีโอ YouTube...</p>
          </div>
        </div>
      )}
    </div>
  );
}

