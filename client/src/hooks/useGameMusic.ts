import { useCallback, useEffect, useRef, useState } from "react";

const MUSIC_START_SECONDS = 20;
const DEFAULT_VOLUME = 0.35;

export function useGameMusic(active: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
  const [blocked, setBlocked] = useState(false);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !active || muted) return;
    try {
      await audio.play();
      setBlocked(false);
    } catch {
      setBlocked(true);
    }
  }, [active, muted]);

  useEffect(() => {
    const audio = new Audio("/audio/itfaiye.mp3");
    audio.preload = "auto";
    audio.volume = DEFAULT_VOLUME;
    audioRef.current = audio;

    const setStartTime = () => {
      if (audio.currentTime < MUSIC_START_SECONDS) audio.currentTime = MUSIC_START_SECONDS;
    };
    const restartFromStartTime = () => {
      audio.currentTime = MUSIC_START_SECONDS;
      if (!audio.muted) void audio.play().catch(() => setBlocked(true));
    };
    audio.addEventListener("loadedmetadata", setStartTime);
    audio.addEventListener("ended", restartFromStartTime);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", setStartTime);
      audio.removeEventListener("ended", restartFromStartTime);
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!active) {
      audio.pause();
      audio.currentTime = MUSIC_START_SECONDS;
      setBlocked(false);
      return;
    }
    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) audio.currentTime = MUSIC_START_SECONDS;
    void play();
  }, [active, play]);

  useEffect(() => {
    if (!blocked || !active) return;
    const resume = () => void play();
    window.addEventListener("pointerdown", resume, { once: true });
    window.addEventListener("keydown", resume, { once: true });
    return () => {
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
  }, [active, blocked, play]);

  const toggleMuted = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      const audio = audioRef.current;
      if (audio) {
        audio.muted = next;
        if (!next && active) void audio.play().catch(() => setBlocked(true));
      }
      return next;
    });
  }, [active]);

  const setVolume = useCallback((nextVolume: number) => {
    const normalized = Math.min(1, Math.max(0, nextVolume));
    setVolumeState(normalized);
    if (audioRef.current) audioRef.current.volume = normalized;
  }, []);

  return { muted, volume, blocked, toggleMuted, setVolume, resume: play };
}
