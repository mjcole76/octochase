import { useState, useRef, useCallback, useEffect } from 'react';

export type MusicTrack = 'ambient' | 'energetic' | 'calm' | 'intense' | 'mysterious' | 'battle' | 'epic' | 'mission' | 'boss_fight' | 'victory';

export type SoundEffectStyle = 'classic' | 'retro' | 'modern' | 'minimal';

interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
  selectedTrack: MusicTrack;
  soundEffectStyle: SoundEffectStyle;
}

interface SoundEffect {
  id: string;
  audio: HTMLAudioElement;
  volume: number;
  loop?: boolean;
}

export const useAudio = () => {
  const [settings, setSettings] = useState<AudioSettings>(() => {
    const saved = localStorage.getItem('octosprint_audio_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved audio settings');
      }
    }
    return {
      masterVolume: 0.7,
      musicVolume: 0.4,
      sfxVolume: 0.6,
      muted: false,
      selectedTrack: 'ambient',
      soundEffectStyle: 'classic',
    };
  });

  const audioContext = useRef<AudioContext | null>(null);
  const soundEffects = useRef<Map<string, SoundEffect>>(new Map());
  const backgroundMusic = useRef<HTMLAudioElement | null>(null);
  const initialized = useRef(false);

  const initializeAudio = useCallback(async () => {
    if (initialized.current) return;
    
    try {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Load background music
      backgroundMusic.current = new Audio();
      backgroundMusic.current.volume = settings.musicVolume * settings.masterVolume;
      backgroundMusic.current.loop = true;
      
      // Create sound effects using Web Audio API for better performance
      const soundConfigs = [
        { id: 'collect', frequency: 800, type: 'sine' as OscillatorType, duration: 0.2 },
        { id: 'dash', frequency: 200, type: 'sawtooth' as OscillatorType, duration: 0.3 },
        { id: 'hit', frequency: 150, type: 'square' as OscillatorType, duration: 0.4 },
        { id: 'powerup', frequency: 600, type: 'sine' as OscillatorType, duration: 0.5 },
        { id: 'bubble', frequency: 400, type: 'sine' as OscillatorType, duration: 0.1 },
        { id: 'combo', frequency: 900, type: 'triangle' as OscillatorType, duration: 0.3 },
      ];

      soundConfigs.forEach(config => {
        soundEffects.current.set(config.id, {
          id: config.id,
          audio: new Audio(),
          volume: 0.5,
          ...config
        } as any);
      });

      initialized.current = true;
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }, [settings.musicVolume, settings.masterVolume]);

  const playSound = useCallback((soundId: string, volume: number = 1) => {
    if (settings.muted || !audioContext.current) return;

    const soundEffect = soundEffects.current.get(soundId);
    if (!soundEffect) return;

    try {
      // Create oscillator for synthetic sound effects
      const oscillator = audioContext.current.createOscillator();
      const gainNode = audioContext.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.current.destination);
      
      // Configure sound based on type
      switch (soundId) {
        case 'collect':
          oscillator.frequency.setValueAtTime(800, audioContext.current.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.current.currentTime + 0.1);
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.3 * volume, audioContext.current.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.2);
          break;
        case 'dash':
          oscillator.frequency.setValueAtTime(200, audioContext.current.currentTime);
          oscillator.frequency.linearRampToValueAtTime(100, audioContext.current.currentTime + 0.3);
          oscillator.type = 'sawtooth';
          gainNode.gain.setValueAtTime(0.4 * volume, audioContext.current.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.3);
          break;
        case 'hit':
          oscillator.frequency.setValueAtTime(150, audioContext.current.currentTime);
          oscillator.type = 'square';
          gainNode.gain.setValueAtTime(0.5 * volume, audioContext.current.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.4);
          break;
        case 'powerup':
          oscillator.frequency.setValueAtTime(600, audioContext.current.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.current.currentTime + 0.2);
          oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.current.currentTime + 0.5);
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.3 * volume, audioContext.current.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.5);
          break;
        case 'bubble':
          oscillator.frequency.setValueAtTime(400, audioContext.current.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.current.currentTime + 0.05);
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.2 * volume, audioContext.current.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.1);
          break;
        case 'combo':
          oscillator.frequency.setValueAtTime(900, audioContext.current.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.current.currentTime + 0.15);
          oscillator.type = 'triangle';
          gainNode.gain.setValueAtTime(0.3 * volume, audioContext.current.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.3);
          break;
      }

      const finalVolume = settings.sfxVolume * settings.masterVolume * volume;
      gainNode.gain.value *= finalVolume;
      
      oscillator.start();
      oscillator.stop(audioContext.current.currentTime + 0.5);
    } catch (error) {
      console.warn(`Failed to play sound ${soundId}:`, error);
    }
  }, [settings.muted, settings.sfxVolume, settings.masterVolume]);

  const playBackgroundMusic = useCallback(async () => {
    if (settings.muted || !audioContext.current) return;

    try {
      const createAmbientLayer = (frequency: number, volume: number, type: OscillatorType, lfoSpeed: number = 0.1) => {
        const oscillator = audioContext.current!.createOscillator();
        const gainNode = audioContext.current!.createGain();
        const filter = audioContext.current!.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.current!.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        
        gainNode.gain.value = volume * settings.musicVolume * settings.masterVolume * 0.1;
        
        // Add slow frequency modulation for ambient effect
        const lfo = audioContext.current!.createOscillator();
        const lfoGain = audioContext.current!.createGain();
        lfo.connect(lfoGain);
        lfoGain.connect(oscillator.frequency);
        lfo.frequency.value = lfoSpeed;
        lfoGain.gain.value = 10;
        
        oscillator.start();
        lfo.start();
        
        return { oscillator, lfo, gainNode };
      };

      // Different music tracks with unique characteristics
      switch (settings.selectedTrack) {
        case 'ambient':
          // Calm underwater atmosphere
          createAmbientLayer(220, 0.3, 'sine', 0.1);
          createAmbientLayer(330, 0.2, 'triangle', 0.15);
          createAmbientLayer(440, 0.1, 'sine', 0.08);
          break;
        case 'energetic':
          // Upbeat, faster tempo
          createAmbientLayer(330, 0.4, 'sawtooth', 0.3);
          createAmbientLayer(440, 0.3, 'square', 0.25);
          createAmbientLayer(550, 0.2, 'triangle', 0.35);
          break;
        case 'calm':
          // Very relaxing, slow
          createAmbientLayer(165, 0.3, 'sine', 0.05);
          createAmbientLayer(220, 0.2, 'sine', 0.07);
          createAmbientLayer(330, 0.1, 'triangle', 0.06);
          break;
        case 'intense':
          // Dramatic, tense
          createAmbientLayer(110, 0.4, 'sawtooth', 0.2);
          createAmbientLayer(220, 0.3, 'square', 0.18);
          createAmbientLayer(330, 0.2, 'triangle', 0.22);
          break;
        case 'mysterious':
          // Eerie, otherworldly
          createAmbientLayer(185, 0.3, 'triangle', 0.12);
          createAmbientLayer(277, 0.25, 'sine', 0.09);
          createAmbientLayer(370, 0.15, 'sawtooth', 0.14);
          break;
        case 'battle':
          // Aggressive combat music
          createAmbientLayer(165, 0.5, 'sawtooth', 0.4);
          createAmbientLayer(330, 0.4, 'square', 0.45);
          createAmbientLayer(495, 0.3, 'sawtooth', 0.38);
          break;
        case 'epic':
          // Grand, heroic theme
          createAmbientLayer(220, 0.5, 'triangle', 0.25);
          createAmbientLayer(440, 0.4, 'sine', 0.28);
          createAmbientLayer(660, 0.3, 'triangle', 0.22);
          break;
        case 'mission':
          // Tactical, focused
          createAmbientLayer(185, 0.4, 'square', 0.35);
          createAmbientLayer(277, 0.35, 'sawtooth', 0.32);
          createAmbientLayer(415, 0.25, 'triangle', 0.38);
          break;
        case 'boss_fight':
          // Intense boss battle
          createAmbientLayer(110, 0.6, 'sawtooth', 0.5);
          createAmbientLayer(165, 0.5, 'square', 0.48);
          createAmbientLayer(247, 0.4, 'sawtooth', 0.52);
          break;
        case 'victory':
          // Triumphant, celebratory
          createAmbientLayer(330, 0.4, 'sine', 0.3);
          createAmbientLayer(495, 0.35, 'triangle', 0.28);
          createAmbientLayer(660, 0.3, 'sine', 0.32);
          break;
      }
      
    } catch (error) {
      console.warn('Failed to play background music:', error);
    }
  }, [settings.muted, settings.musicVolume, settings.masterVolume, settings.selectedTrack]);

  const stopBackgroundMusic = useCallback(() => {
    if (backgroundMusic.current) {
      backgroundMusic.current.pause();
      backgroundMusic.current.currentTime = 0;
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<AudioSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('octosprint_audio_settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const changeMusicTrack = useCallback((track: MusicTrack) => {
    updateSettings({ selectedTrack: track });
    // Restart music with new track
    if (!settings.muted) {
      stopBackgroundMusic();
      setTimeout(() => playBackgroundMusic(), 100);
    }
  }, [settings.muted, stopBackgroundMusic, playBackgroundMusic, updateSettings]);

  const changeSoundEffectStyle = useCallback((style: SoundEffectStyle) => {
    updateSettings({ soundEffectStyle: style });
  }, [updateSettings]);

  const toggleMute = useCallback(() => {
    setSettings(prev => ({ ...prev, muted: !prev.muted }));
  }, []);

  // Initialize audio on first user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!initialized.current) {
        initializeAudio();
      }
    };

    document.addEventListener('touchstart', handleUserInteraction, { once: true });
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [initializeAudio]);

  return {
    settings,
    playSound,
    playBackgroundMusic,
    stopBackgroundMusic,
    updateSettings,
    toggleMute,
    changeMusicTrack,
    changeSoundEffectStyle,
    initialized: initialized.current,
  };
};