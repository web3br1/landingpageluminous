"use client";

import React from "react";

interface VideoData {
  src?: string;
  videoId?: string;
  poster?: string;
  title: string;
  duration?: string;
  format?: "youtube" | "local";
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

  return (
    <div className={`${className} relative group cursor-pointer`}>
      <video
        className="w-full h-full rounded-lg object-cover"
        poster={video.poster}
        controls
        preload="metadata"
        onPlay={() => onPlay?.(video)}
      >
        <source src={video.src} type="video/mp4" />
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
