import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../services/icons';

interface AudioVoicePlayerProps {
  url: string;
  duration?: number;
  waveform?: number[];
  isOutgoing?: boolean;
}

export const AudioVoicePlayer: React.FC<AudioVoicePlayerProps> = ({
  url,
  duration = 0,
  waveform = [30, 45, 75, 90, 60, 40, 70, 85, 95, 60, 40, 80, 50, 65, 45, 30],
  isOutgoing = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setTotalDuration(Math.round(audio.duration));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Audio playback error:', err);
      });
    }
  };

  const handleSeek = (index: number) => {
    const audio = audioRef.current;
    if (!audio || totalDuration <= 0) return;
    const seekFraction = index / waveform.length;
    const targetTime = seekFraction * totalDuration;
    audio.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const toggleSpeed = () => {
    const rates = [1.0, 1.5, 2.0];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressFraction = totalDuration > 0 ? currentTime / totalDuration : 0;

  return (
    <div className="flex items-center gap-3 py-1 px-1 min-w-[220px] max-w-[280px]">
      <audio ref={audioRef} src={url} preload="metadata" />
      
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-sm ${
          isOutgoing
            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
            : 'bg-emerald-500 text-white hover:bg-emerald-600'
        }`}
        aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
      >
        {isPlaying ? <Icons.pause className="w-5 h-5" /> : <Icons.play className="w-5 h-5 ml-0.5" />}
      </button>

      {/* Waveform visualizer & track */}
      <div className="flex-1 flex flex-col justify-center gap-1.5 overflow-hidden">
        <div className="flex items-center gap-0.5 h-7 cursor-pointer" title="Click to seek">
          {waveform.map((heightPercent, idx) => {
            const barFraction = idx / waveform.length;
            const isPassed = barFraction <= progressFraction;
            return (
              <div
                key={idx}
                onClick={() => handleSeek(idx)}
                style={{ height: `${Math.max(20, heightPercent)}%` }}
                className={`flex-1 rounded-full transition-colors ${
                  isPassed
                    ? isOutgoing ? 'bg-emerald-300' : 'bg-emerald-400'
                    : isOutgoing ? 'bg-emerald-800/40' : 'bg-slate-600/40'
                } hover:opacity-80`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono leading-none opacity-80 select-none">
          <span>{formatTime(currentTime > 0 ? currentTime : totalDuration)}</span>
          <button
            type="button"
            onClick={toggleSpeed}
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider transition ${
              isOutgoing ? 'bg-emerald-700/60 hover:bg-emerald-700 text-emerald-100' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
};
