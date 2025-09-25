"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  courseId: string;
  lessonId: string;
  onProgress?: (progress: number, timeSpent: number) => void;
  onComplete?: () => void;
  autoplay?: boolean;
  allowSeek?: boolean;
  watermark?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  title,
  courseId,
  lessonId,
  onProgress,
  onComplete,
  autoplay = false,
  allowSeek = true,
  watermark
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Progress tracking
  const [watchedTime, setWatchedTime] = useState(0);
  const [lastProgressUpdate, setLastProgressUpdate] = useState(0);
  const progressUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Update buffered progress
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered((bufferedEnd / video.duration) * 100);
      }
      
      // Track watch time
      const now = Date.now();
      if (now - lastProgressUpdate >= 1000) { // Update every second
        const newWatchedTime = watchedTime + (now - lastProgressUpdate) / 1000;
        setWatchedTime(newWatchedTime);
        setLastProgressUpdate(now);
        
        // Send progress update
        const progressPercent = (video.currentTime / video.duration) * 100;
        onProgress?.(progressPercent, newWatchedTime);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onComplete?.();
      toast.success('Lesson completed!');
    };

    const handleError = () => {
      setError('Failed to load video. Please check your connection and try again.');
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      if (autoplay) {
        video.play().catch(console.error);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('canplay', handleCanPlay);

    // Start progress tracking
    setLastProgressUpdate(Date.now());
    progressUpdateInterval.current = setInterval(() => {
      if (isPlaying && video && !video.paused) {
        const now = Date.now();
        const deltaTime = (now - lastProgressUpdate) / 1000;
        setWatchedTime(prev => prev + deltaTime);
        setLastProgressUpdate(now);
        
        const progressPercent = (video.currentTime / video.duration) * 100;
        onProgress?.(progressPercent, watchedTime + deltaTime);
      }
    }, 1000);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', handleCanPlay);
      
      if (progressUpdateInterval.current) {
        clearInterval(progressUpdateInterval.current);
      }
    };
  }, [videoUrl, isPlaying, onProgress, onComplete, autoplay, watchedTime, lastProgressUpdate]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (video.paused) {
        await video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error toggling play:', error);
      toast.error('Failed to play video');
    }
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video || !allowSeek) return;
    
    const newTime = (value[0] / 100) * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newVolume = value[0] / 100;
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isMuted) {
      video.volume = volume;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const skipTime = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <Card className="aspect-video flex items-center justify-center bg-red-50">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <Button onClick={() => {
            setError(null);
            setIsLoading(true);
          }} variant="outline">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative aspect-video bg-black rounded-lg overflow-hidden group ${isFullscreen ? 'w-screen h-screen' : ''}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        crossOrigin="anonymous"
        preload="metadata"
        onContextMenu={(e) => e.preventDefault()} // Disable right-click
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}

      {/* Watermark */}
      {watermark && (
        <div className="absolute top-4 right-4 text-white text-sm opacity-50 pointer-events-none">
          {watermark}
        </div>
      )}

      {/* Controls overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-black/50 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Center play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            size="lg"
            variant="secondary"
            className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 border-0"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1" />
            )}
          </Button>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Progress bar */}
          <div className="mb-3">
            <Slider
              value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
              onValueChange={handleSeek}
              className="w-full"
              disabled={!allowSeek}
            />
            <div className="flex justify-between text-xs text-white mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() => skipTime(-10)}
              >
                <SkipBack className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() => skipTime(10)}
              >
                <SkipForward className="w-4 h-4" />
              </Button>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
                <div className="w-16">
                  <Slider
                    value={[isMuted ? 0 : volume * 100]}
                    onValueChange={handleVolumeChange}
                    max={100}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={playbackRate}
                onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
                className="bg-transparent text-white text-sm border border-white/20 rounded px-2 py-1"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>

              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Title overlay */}
      <div className="absolute top-4 left-4 right-16">
        <h3 className="text-white font-semibold text-lg truncate">{title}</h3>
      </div>
    </div>
  );
};

export default VideoPlayer;