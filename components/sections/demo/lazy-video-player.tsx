"use client";

import React from "react";

interface VideoData {
  src?: string;
  videoId?: string;
  poster?: string;
  title: string;
  duration?: string;
  format?: "youtube" | "local" | "mp4" | "webm" | "vimeo";
}

interface LazyVideoPlayerProps {
  video: VideoData;
  onPlay?: (video: VideoData) => void;
  className?: string;
}

export default function LazyVideoPlayer({
  video,
  onPlay,
  className,
}: LazyVideoPlayerProps) {
  // Handle YouTube videos
  if (video.format === "youtube" && video.videoId) {
    return (
      <div className={className}>
        <iframe
          src={`https://www.youtube.com/embed/${video.videoId}?rel=0`}
          title={video.title}
          className="w-full h-full rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Handle Vimeo videos
  if (video.format === "vimeo" && video.videoId) {
    return (
      <div className={className}>
        <iframe
          src={`https://player.vimeo.com/video/${video.videoId}`}
          title={video.title}
          className="w-full h-full rounded-lg"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Handle local videos (mp4, webm)
  if ((video.format === "mp4" || video.format === "webm" || video.format === "local") && video.src) {
    return (
      <div className={`${className} relative group cursor-pointer`}>
        <video
          className="w-full h-full rounded-lg object-cover"
          poster={video.poster}
          controls
          preload="metadata"
          onPlay={() => onPlay?.(video)}
        >
          <source src={video.src} type={`video/${video.format === "local" ? "mp4" : video.format}`} />
          Seu navegador não suporta o elemento video.
        </video>
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {video.duration}
          </div>
        )}
      </div>
    );
  }

  // Fallback for unsupported formats
  return (
    <div className={`${className} flex items-center justify-center bg-muted rounded-lg`}>
      <div className="text-center p-4">
        <p className="text-muted-foreground">Formato de vídeo não suportado</p>
        <p className="text-sm text-muted-foreground mt-1">{video.title}</p>
      </div>
    </div>
  );
}
