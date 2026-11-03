"use client";

import React, { useEffect, useRef, useState } from "react";
import { HiPlay, HiPause } from "react-icons/hi2";

interface AudioPlayerProps {
  src: string;
  isOwn?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, isOwn = false }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Fixed static waveform heights pattern for consistent aesthetic wave bars
  const waveHeights = [40, 65, 80, 50, 95, 30, 75, 90, 60, 85, 45, 100, 70, 50, 85, 60, 40, 70, 90, 35, 60, 80];

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-2xl w-64 sm:w-72 select-none ${
        isOwn
          ? "bg-white/15 text-white"
          : "bg-slate-200/70 dark:bg-slate-750 text-slate-900 dark:text-slate-100"
      }`}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`p-2.5 rounded-full flex-shrink-0 transition-all active:scale-95 shadow-sm ${
          isOwn
            ? "bg-white text-sky-600 hover:bg-slate-100"
            : "bg-gradient-to-tr from-indigo-500 to-sky-500 text-white hover:from-indigo-600 hover:to-sky-600 shadow-sky-500/20"
        }`}
      >
        {isPlaying ? <HiPause className="w-4 h-4" /> : <HiPlay className="w-4 h-4 translate-x-0.5" />}
      </button>

      {/* Waveform & Progress */}
      <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
        <div className="relative flex items-center gap-0.5 h-6 cursor-pointer">
          {/* Wave visualizer bars */}
          {waveHeights.map((heightPercent, idx) => {
            const barProgress = (idx / waveHeights.length) * 100;
            const isPlayed = barProgress <= progress;

            return (
              <span
                key={idx}
                style={{ height: `${heightPercent}%` }}
                className={`flex-1 rounded-full transition-all duration-75 ${
                  isPlayed
                    ? isOwn
                      ? "bg-white"
                      : "bg-sky-500 dark:bg-sky-400"
                    : isOwn
                    ? "bg-white/35"
                    : "bg-slate-300 dark:bg-slate-600"
                } ${isPlaying ? "animate-pulse" : ""}`}
              />
            );
          })}

          {/* Hidden range input over waveform for intuitive click & scrub */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-semibold opacity-75">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration || 0)}</span>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;

