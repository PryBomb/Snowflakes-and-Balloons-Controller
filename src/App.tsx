/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Trash2, 
  Sliders, 
  Sun, 
  Moon, 
  Wind, 
  Gauge, 
  Volume2, 
  VolumeX, 
  Zap, 
  Info 
} from 'lucide-react';

interface SnowflakeItem {
  id: number;
  x: number;
  duration: number;
  size: number;
  swayDistance: number;
  swayDuration: number;
  rotateDeg: number;
  maxOpacity: number;
  bornAt: number;
}

interface BalloonItem {
  id: number;
  x: number;
  duration: number;
  size: number;
  swayDistance: number;
  swayDuration: number;
  color: string;
  maxOpacity: number;
  bornAt: number;
}

interface ConfettiItem {
  id: number;
  x: number;
  duration: number;
  size: number;
  swayDistance: number;
  swayDuration: number;
  color: string;
  shape: 'circle' | 'square' | 'triangle';
  rotateDeg: number;
  maxOpacity: number;
  bornAt: number;
}

// Client-side Web Audio synthesis for tactical feedback
const playSound = (type: 'snow' | 'balloon' | 'confetti' | 'reset', muted: boolean) => {
  if (muted) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (type === 'snow') {
      // Crystal bell chime (Snowflake feel)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    } else if (type === 'balloon') {
      // Soaring buoyant glide (Balloon float feel)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(190, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(380, ctx.currentTime + 0.5);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else if (type === 'confetti') {
      // Short happy arpeggio clicks (Festive feel)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.setValueAtTime(780, ctx.currentTime + 0.04);
      osc.frequency.setValueAtTime(1040, ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } else if (type === 'reset') {
      // Low clean frequency discharge sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.35);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {
    console.warn('Audio synthesis failed or blocked by autoplay constraints', e);
  }
};

export default function App() {
  const [snowflakes, setSnowflakes] = useState<SnowflakeItem[]>([]);
  const [balloons, setBalloons] = useState<BalloonItem[]>([]);
  const [confetti, setConfetti] = useState<ConfettiItem[]>([]);

  // Darkmode preference
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Time remaining counters (ticks down from 5000 in ms)
  const [snowActiveTime, setSnowActiveTime] = useState<number>(0);
  const [balloonsActiveTime, setBalloonsActiveTime] = useState<number>(0);
  const [confettiActiveTime, setConfettiActiveTime] = useState<number>(0);

  // Configurations (Wind: left drift, none, right drift)
  const [wind, setWind] = useState<'left' | 'none' | 'right'>('none');

  // Velocity modifier: 'slow' | 'normal' | 'fast'
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');

  // Audio configuration
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // 1. Decaying Remaining Active Timer Tick
  useEffect(() => {
    let lastTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTime;
      lastTime = now;

      setSnowActiveTime((prev) => Math.max(0, prev - delta));
      setBalloonsActiveTime((prev) => Math.max(0, prev - delta));
      setConfettiActiveTime((prev) => Math.max(0, prev - delta));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Calculate speed multipliers dynamically based on selection
  const getSpeedMultiplier = () => {
    if (speed === 'slow') return 1.6;
    if (speed === 'fast') return 0.55;
    return 1.0;
  };

  // Calculate wind sway ranges mapping to particle coordinates
  const getWindOffsets = () => {
    if (wind === 'left') return { baseSway: -90, jitter: 35 };
    if (wind === 'right') return { baseSway: 60, jitter: 35 };
    return { baseSway: -20, jitter: 40 }; // standard balance center
  };

  // 2. High-Precision Snowflake Spawner
  useEffect(() => {
    if (snowActiveTime <= 0) return;

    const spawner = setInterval(() => {
      const { baseSway, jitter } = getWindOffsets();
      const speedMult = getSpeedMultiplier();

      setSnowflakes((prev) => [
        ...prev,
        {
          id: Math.random() + Date.now(),
          x: Math.random() * 92 + 4, 
          duration: (3.0 + Math.random() * 1.5) * speedMult, // adjusted by speed option
          size: 48 + Math.random() * 16, // DOUBLED SIZE (48px to 64px instead of 24px-32px)
          swayDistance: baseSway + Math.random() * jitter, // influenced directly by wind settings
          swayDuration: 2.4 + Math.random() * 1.4,
          rotateDeg: -180 + Math.random() * 360,
          maxOpacity: 0.55 + Math.random() * 0.35,
          bornAt: Date.now(),
        },
      ]);
    }, 110);

    return () => clearInterval(spawner);
  }, [snowActiveTime > 0, wind, speed]);

  // 3. High-Precision Balloon Spawner
  useEffect(() => {
    if (balloonsActiveTime <= 0) return;

    const premiumColors = [
      '#f87171', // Coral Red
      '#60a5fa', // Steel Sky Blue
      '#34d399', // Emerald Sage
      '#f59e0b', // Rich Amber
      '#c084fc', // Lavender Frost
      '#fb7185', // Rose Pink
    ];

    const spawner = setInterval(() => {
      const randomColor = premiumColors[Math.floor(Math.random() * premiumColors.length)];
      const { baseSway, jitter } = getWindOffsets();
      const speedMult = getSpeedMultiplier();

      setBalloons((prev) => [
        ...prev,
        {
          id: Math.random() + Date.now(),
          x: Math.random() * 88 + 6,
          duration: (3.6 + Math.random() * 1.4) * speedMult,
          size: 38 + Math.random() * 8, 
          swayDistance: baseSway + Math.random() * jitter, 
          swayDuration: 3.0 + Math.random() * 1.8,
          color: randomColor,
          maxOpacity: 0.85 + Math.random() * 0.15,
          bornAt: Date.now(),
        },
      ]);
    }, 200);

    return () => clearInterval(spawner);
  }, [balloonsActiveTime > 0, wind, speed]);

  // 4. High-Precision Confetti Spawner (New Premium Feature)
  useEffect(() => {
    if (confettiActiveTime <= 0) return;

    const confettiColors = [
      '#fbbf24', // Yellow Gold
      '#f87171', // Coral Red
      '#38bdf8', // Light Sky
      '#818cf8', // Indigo Tint
      '#f472b6', // Pink Magenta
      '#34d399', // Sage Teal
    ];
    const shapes: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle'];

    const spawner = setInterval(() => {
      const randomColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
      const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
      const { baseSway, jitter } = getWindOffsets();
      const speedMult = getSpeedMultiplier();

      setConfetti((prev) => [
        ...prev,
        {
          id: Math.random() + Date.now(),
          x: Math.random() * 94 + 3,
          duration: (2.8 + Math.random() * 1.4) * speedMult,
          size: 16 + Math.random() * 8, 
          swayDistance: baseSway + Math.random() * jitter,
          swayDuration: 2.0 + Math.random() * 1.5,
          color: randomColor,
          shape: randomShape,
          rotateDeg: 360 + Math.random() * 360,
          maxOpacity: 0.8 + Math.random() * 0.2,
          bornAt: Date.now(),
        },
      ]);
    }, 90); // Dense celebratory flow rates

    return () => clearInterval(spawner);
  }, [confettiActiveTime > 0, wind, speed]);

  // 5. Automatic Garbage Collector for Expired Nodes
  useEffect(() => {
    const gc = setInterval(() => {
      const now = Date.now();
      setSnowflakes((prev) => prev.filter((s) => now - s.bornAt < (s.duration * 1000) + 1000));
      setBalloons((prev) => prev.filter((b) => now - b.bornAt < (b.duration * 1000) + 1000));
      setConfetti((prev) => prev.filter((c) => now - c.bornAt < (c.duration * 1000) + 1000));
    }, 1000);

    return () => clearInterval(gc);
  }, []);

  const triggerSnowflakes = () => {
    setSnowActiveTime(5000);
    playSound('snow', isMuted);
  };

  const triggerBalloons = () => {
    setBalloonsActiveTime(5000);
    playSound('balloon', isMuted);
  };

  const triggerConfetti = () => {
    setConfettiActiveTime(5000);
    playSound('confetti', isMuted);
  };

  const resetAll = () => {
    setSnowActiveTime(0);
    setBalloonsActiveTime(0);
    setConfettiActiveTime(0);
    setSnowflakes([]);
    setBalloons([]);
    setConfetti([]);
    playSound('reset', isMuted);
  };

  const isAnyActive = snowActiveTime > 0 || balloonsActiveTime > 0 || confettiActiveTime > 0;

  return (
    <div className={`relative w-screen h-screen overflow-hidden flex items-center justify-center font-sans select-none antialiased transition-colors duration-500 ${
      darkMode 
        ? 'bg-zinc-950 text-zinc-100' 
        : 'bg-zinc-100/60 text-zinc-900'
    }`}>
      
      {/* 1. Ambient Background Accents */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
        darkMode 
          ? 'bg-radial-gradient from-zinc-900/50 via-zinc-950 to-black opacity-95' 
          : 'bg-radial-gradient from-white/90 via-zinc-100/80 to-zinc-200/50 opacity-90'
      }`} />

      {/* Glassmorphic Aesthetic Light Blobs - essential to make frosted glass refract and glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div 
          className={`absolute top-[12%] left-[8%] w-[260px] h-[260px] rounded-full filter blur-[80px] transition-all duration-1000 ${
            darkMode ? 'bg-indigo-600/18' : 'bg-indigo-300/25'
          }`}
        />
        <div 
          className={`absolute bottom-[10%] right-[12%] w-[320px] h-[320px] rounded-full filter blur-[90px] transition-all duration-1000 ${
            darkMode ? 'bg-rose-600/12' : 'bg-rose-300/20'
          }`}
        />
        <div 
          className={`absolute top-[40%] right-[20%] w-[180px] h-[180px] rounded-full filter blur-[70px] transition-all duration-1000 ${
            darkMode ? 'bg-sky-500/12' : 'bg-sky-300/15'
          }`}
        />
      </div>
      
      {/* Dynamic Grid overlay to preserve the strict/formal environment workspace feel */}
      <div className={`absolute inset-0 pointer-events-none bg-[size:16px_28px] z-1 transition-colors duration-500 ${
        darkMode
          ? 'bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)]'
          : 'bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)]'
      }`} />

      {/* 2. Interactive Floating Particle Canvas Stage (foreground, pointer-events-none click-thru) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-30">
        
        {/* Falling Snowflake Layer */}
        {snowflakes.map((snowflake) => (
          <div
            key={snowflake.id}
            className="absolute top-0 animate-snow flex items-center justify-center pointer-events-none"
            style={{
              left: `${snowflake.x}%`,
              '--duration': `${snowflake.duration}s`,
              '--sway-duration': `${snowflake.swayDuration}s`,
              '--sway-distance': `${snowflake.swayDistance}px`,
              '--rotate-deg': `${snowflake.rotateDeg}deg`,
              '--max-opacity': snowflake.maxOpacity,
              width: `${snowflake.size}px`,
              height: `${snowflake.size}px`,
            } as React.CSSProperties}
          >
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              className={`w-full h-full drop-shadow-sm ${
                darkMode ? 'text-zinc-200/90' : 'text-slate-400/90'
              }`}
            >
              <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke="currentColor" strokeWidth="1.0" strokeLinecap="round" />
              <line x1="4.93" y1="19.07" x2="19.07" y2="4.93" stroke="currentColor" strokeWidth="1.0" strokeLinecap="round" />
              
              {/* Complex inner facets inside Snowflake to make double-size snowflakes look majestic and precise */}
              <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.0" fill={darkMode ? '#18181b' : '#ffffff'} />
              <path d="M12 5l2 1.2M12 5l-2 1.2" stroke="currentColor" strokeWidth="1.0" strokeLinecap="round" />
              <path d="M12 19l2 -1.2M12 19l-2 -1.2" stroke="currentColor" strokeWidth="1.0" strokeLinecap="round" />
              <path d="M5 12l1.2 2M5 12l1.2 -2" stroke="currentColor" strokeWidth="1.0" strokeLinecap="round" />
              <path d="M19 12l-1.2 2M19 12l-1.2 -2" stroke="currentColor" strokeWidth="1.0" strokeLinecap="round" />
            </svg>
          </div>
        ))}

        {/* Floating Balloons Layer */}
        {balloons.map((balloon) => (
          <div
            key={balloon.id}
            className="absolute top-0 animate-balloon flex flex-col items-center justify-center pointer-events-none"
            style={{
              left: `${balloon.x}%`,
              '--duration': `${balloon.duration}s`,
              '--sway-duration': `${balloon.swayDuration}s`,
              '--sway-distance': `${balloon.swayDistance}px`,
              '--max-opacity': balloon.maxOpacity,
              width: `${balloon.size}px`,
              height: `${balloon.size * 1.35}px`,
            } as React.CSSProperties}
          >
            <svg viewBox="0 0 44 60" fill="none" className="w-full h-full drop-shadow-md">
              <path
                d="M22 2C11.5 2 3 10 3 20C3 32.5 14 44 22 46C30 44 41 32.5 41 20C41 10 32.5 2 22 2Z"
                fill={balloon.color}
                fillOpacity="0.95"
              />
              <ellipse
                cx="14"
                cy="12"
                rx="3.5"
                ry="5.5"
                fill="white"
                fillOpacity="0.35"
                transform="rotate(-28 14 12)"
              />
              <path d="M22 45L18 50H26L22 45Z" fill={balloon.color} />
              <path
                d="M22 50C24 54.5 19.5 58.5 22 63"
                stroke={darkMode ? '#9ca3af' : '#475569'}
                strokeWidth="1"
                strokeLinecap="round"
              />
            </svg>
          </div>
        ))}

        {/* Celebrate Confetti Layer (New shape parameters) */}
        {confetti.map((c) => (
          <div
            key={c.id}
            className="absolute top-0 animate-confetti flex items-center justify-center pointer-events-none"
            style={{
              left: `${c.x}%`,
              '--duration': `${c.duration}s`,
              '--sway-duration': `${c.swayDuration}s`,
              '--sway-distance': `${c.swayDistance}px`,
              '--rotate-deg': `${c.rotateDeg}deg`,
              '--max-opacity': c.maxOpacity,
              width: `${c.size}px`,
              height: `${c.size}px`,
            } as React.CSSProperties}
          >
            {c.shape === 'circle' && (
              <div 
                className="rounded-full shadow-xs" 
                style={{ width: '85%', height: '85%', backgroundColor: c.color, opacity: 0.95 }} 
              />
            )}
            {c.shape === 'square' && (
              <div 
                className="rounded-2xs shadow-xs" 
                style={{ width: '100%', height: '100%', backgroundColor: c.color, opacity: 0.95 }} 
              />
            )}
            {c.shape === 'triangle' && (
              <svg viewBox="0 0 24 24" className="w-full h-full shadow-xs">
                <polygon points="12,2 2,22 22,22" fill={c.color} />
              </svg>
            )}
          </div>
        ))}

      </div>

      {/* 3. Main Glassmorphic Control Terminal Interface Card */}
      <div className="relative z-40 w-full max-w-lg mx-4">
        
        {/* Soft edge color glow under the frosted dynamic panel */}
        <div className={`absolute -inset-1.5 rounded-3xl opacity-50 blur-xl transition duration-1000 ${
          darkMode 
            ? 'bg-linear-to-r from-sky-500/25 via-indigo-600/30 to-rose-500/20' 
            : 'bg-linear-to-r from-sky-400/15 via-zinc-300/35 to-amber-300/20'
        }`} />
        
        {/* FROSTED GLASS CONTAINER */}
        <div className={`relative border rounded-3xl p-6 sm:p-8 transition-all duration-500 backdrop-blur-2xl ${
          darkMode 
            ? 'bg-zinc-950/45 border-white/[0.09] text-zinc-100 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] shadow-black/60' 
            : 'bg-white/45 border-white/[0.6] text-zinc-900 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.06)]'
        }`}>
          
          {/* Top Panel Actions Row: Mute Toggle */}
          <div className="absolute top-5 right-5 flex items-center gap-2.5 z-50">
            
            {/* Tone Generator Toggle Switch */}
            <button
              onClick={() => setIsMuted((prev) => !prev)}
              title={isMuted ? 'Unmute tactical tones' : 'Mute tactical tones'}
              className={`p-2.5 rounded-xl border transition-all duration-300 active:scale-95 cursor-pointer backdrop-blur-md ${
                darkMode 
                  ? 'bg-white/[0.04] border-white/[0.08] text-zinc-300 hover:text-white hover:bg-white/[0.09]' 
                  : 'bg-black/[0.02] border-black/[0.06] text-zinc-600 hover:text-black hover:bg-black/[0.05]'
              }`}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} className="animate-bounce" style={{ animationDuration: '4s' }} />}
            </button>

          </div>

          {/* Header Segment */}
          <div className="flex flex-col items-center text-center mt-2">
            <div className={`flex items-center justify-center w-11 h-11 rounded-full border mb-3 shadow-xs transition-colors duration-500 backdrop-blur-md ${
              darkMode ? 'bg-white/[0.04] border-white/[0.08] text-indigo-400' : 'bg-black/[0.02] border-black/[0.04] text-zinc-500'
            }`}>
              <Sliders size={18} className="animate-spin" style={{ animationDuration: '24s' }} />
            </div>
            
            <span className={`font-mono text-[9px] tracking-[0.22em] font-bold uppercase leading-none ${
              darkMode ? 'text-indigo-450/90' : 'text-zinc-500/90'
            }`}>
              Atmosphere Station
            </span>
            
            <h1 className="font-serif text-3.5xl font-light tracking-wide mt-1.5 select-text">
              Simulation Console
            </h1>
            
            <p className={`text-xs mt-2 max-w-xs leading-relaxed select-text transition-colors duration-500 ${
              darkMode ? 'text-zinc-400' : 'text-zinc-600'
            }`}>
              Trigger dynamic 5-second particle vectors, customized via wind velocities and physical constants.
            </p>
          </div>

          {/* Divider */}
          <div className={`my-5 flex items-center justify-center gap-2 transition-colors duration-500 ${
            darkMode ? 'text-zinc-800' : 'text-zinc-200'
          }`}>
            <div className="h-px bg-current w-16 opacity-30" />
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 opacity-60" />
            <div className="h-px bg-current w-16 opacity-30" />
          </div>

          {/* NEW EXPLICIT DARK MODE ON/OFF CONTROLLER WIDGET */}
          <div className={`p-4 rounded-2xl border mb-5 transition-all duration-300 ${
            darkMode 
              ? 'bg-zinc-950/70 border-white/[0.06]' 
              : 'bg-white/60 border-white/[0.5] shadow-xs'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider text-zinc-400 uppercase font-semibold">
                  {darkMode ? <Moon size={11} className="text-indigo-400" /> : <Sun size={11} className="text-amber-500" />}
                  <span>Display Environment</span>
                </span>
                <span className={`text-[11px] block mt-0.5 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Toggle {darkMode ? 'Cosmic Obsidian Dark' : 'Serene Frosted Light'} system
                </span>
              </div>

              {/* Elegant Pill Switch ON/OFF */}
              <button
                onClick={() => setDarkMode((prev) => !prev)}
                className={`relative w-28 h-9 rounded-full p-1 transition-all duration-500 cursor-pointer flex items-center justify-between border ${
                  darkMode 
                    ? 'bg-zinc-900 border-white/[0.08] shadow-inner' 
                    : 'bg-zinc-200/80 border-black/[0.06] shadow-xs'
                }`}
              >
                {/* Visual Sliding Pointer Node */}
                <div 
                  className={`absolute top-1 bottom-1 w-13 rounded-full transition-all duration-500 flex items-center justify-center shadow-md ${
                    darkMode 
                      ? 'left-14 bg-indigo-600 text-white' 
                      : 'left-1 bg-white text-zinc-900'
                  }`}
                >
                  <span className="font-mono text-[9px] uppercase font-bold tracking-wider">
                    {darkMode ? 'ON' : 'OFF'}
                  </span>
                </div>

                {/* Constant underlying labels for clarity */}
                <span className={`w-1/2 text-center font-mono text-[9px] font-bold transition-all ${darkMode ? 'text-zinc-500' : 'text-zinc-800'}`}>
                  LIGHT
                </span>
                <span className={`w-1/2 text-center font-mono text-[9px] font-bold transition-all ${darkMode ? 'text-zinc-100' : 'text-zinc-400'}`}>
                  DARK
                </span>
              </button>
            </div>
          </div>

          {/* Configuration Matrix (Tactile Custom Settings) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            
            {/* Wind Vector Panel */}
            <div className={`p-4 rounded-xl border transition-colors duration-500 ${
              darkMode ? 'bg-zinc-950/60 border-white/[0.05]' : 'bg-white/40 border-white/[0.4]'
            }`}>
              <label className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider text-zinc-400 uppercase font-semibold mb-2">
                <Wind size={12} className="text-sky-400" />
                <span>Wind Vector</span>
              </label>
              
              <div className="grid grid-cols-3 gap-1 bg-black/15 p-1 rounded-lg">
                {(['left', 'none', 'right'] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => setWind(w)}
                    className={`py-1.5 px-1 text-[11px] font-medium rounded-md transition-all capitalize cursor-pointer ${
                      wind === w
                        ? (darkMode ? 'bg-indigo-600/90 text-white shadow-sm' : 'bg-zinc-900 text-white shadow-sm')
                        : (darkMode ? 'text-zinc-400 hover:text-white hover:bg-white/[0.05]' : 'text-zinc-600 hover:bg-black/[0.04]')
                    }`}
                  >
                    {w === 'none' ? 'Calm' : w}
                  </button>
                ))}
              </div>
            </div>

            {/* Velocity Scale Controller */}
            <div className={`p-4 rounded-xl border transition-colors duration-500 ${
              darkMode ? 'bg-zinc-950/60 border-white/[0.05]' : 'bg-white/40 border-white/[0.4]'
            }`}>
              <label className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider text-zinc-400 uppercase font-semibold mb-2">
                <Gauge size={12} className="text-teal-400" />
                <span>Atmospheric Speed</span>
              </label>

              <div className="grid grid-cols-3 gap-1 bg-black/15 p-1 rounded-lg">
                {(['slow', 'normal', 'fast'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`py-1.5 px-1 text-[11px] font-medium rounded-md transition-all capitalize cursor-pointer ${
                      speed === s
                        ? (darkMode ? 'bg-indigo-600/90 text-white shadow-sm' : 'bg-zinc-900 text-white shadow-sm')
                        : (darkMode ? 'text-zinc-400 hover:text-white hover:bg-white/[0.05]' : 'text-zinc-600 hover:bg-black/[0.04]')
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Interactive Screen Dashboard Panel */}
          <div className={`border rounded-xl p-4 mb-5 text-center select-text transition-colors duration-500 ${
            darkMode 
              ? 'bg-zinc-950/80 border-white/[0.04] shadow-inner' 
              : 'bg-white/30 border-white/[0.4] shadow-xs'
          }`}>
            
            {/* If neither effect is active */}
            {!isAnyActive && (
              <div className="space-y-1 py-1">
                <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-emerald-500 block">
                  ● SIMULATOR READY
                </span>
                <span className={`text-[11px] block font-normal leading-normal ${
                  darkMode ? 'text-zinc-400' : 'text-zinc-600'
                }`}>
                  Chamber initialized. Fire particle triggers to render medium & large layers.
                </span>
              </div>
            )}

            {/* If at least one effect is active */}
            {isAnyActive && (
              <div className="space-y-3.5">
                
                {/* Status Readout Title */}
                <div className="space-y-0.5">
                  <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-indigo-400 block animate-pulse">
                    ● SYSTEMS ACTIVE
                  </span>
                  <div className="flex h-3 items-center justify-center gap-1 mt-1">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase">
                      Wind: {wind} · Speed: {speed}
                    </span>
                  </div>
                </div>

                {/* Particle Timers & Progress Bars */}
                <div className="space-y-2.5 text-left max-w-xs mx-auto">
                  
                  {/* Snowflakes timer */}
                  {snowActiveTime > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px] font-medium text-zinc-400">
                        <span className="flex items-center gap-1.5 font-mono text-[10px]">
                          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                          SNOWSTORMS {snowflakes.length > 0 && `(${snowflakes.length})`}
                        </span>
                        <span className={`font-mono px-1.5 py-0.5 rounded text-[9px] shadow-2xs ${
                          darkMode ? 'text-zinc-100 bg-white/[0.04] border-white/[0.08] border' : 'text-zinc-700 bg-white border border-black/[0.08]'
                        }`}>
                          {(snowActiveTime / 1000).toFixed(2)}s left
                        </span>
                      </div>
                      <div className={`h-1 rounded-full overflow-hidden ${darkMode ? 'bg-white/[0.06]' : 'bg-black/[0.06]'}`}>
                        <div
                          className="h-full bg-sky-400 transition-all duration-75 ease-linear rounded-full"
                          style={{ width: `${(snowActiveTime / 5000) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Balloons timer */}
                  {balloonsActiveTime > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px] font-medium text-zinc-400">
                        <span className="flex items-center gap-1.5 font-mono text-[10px]">
                          <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                          BALLOONSFLOAT {balloons.length > 0 && `(${balloons.length})`}
                        </span>
                        <span className={`font-mono px-1.5 py-0.5 rounded text-[9px] shadow-2xs ${
                          darkMode ? 'text-zinc-100 bg-white/[0.04] border-white/[0.08] border' : 'text-zinc-700 bg-white border border-black/[0.08]'
                        }`}>
                          {(balloonsActiveTime / 1000).toFixed(2)}s left
                        </span>
                      </div>
                      <div className={`h-1 rounded-full overflow-hidden ${darkMode ? 'bg-white/[0.06]' : 'bg-black/[0.06]'}`}>
                        <div
                          className="h-full bg-rose-400 transition-all duration-75 ease-linear rounded-full"
                          style={{ width: `${(balloonsActiveTime / 5000) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Confetti timer */}
                  {confettiActiveTime > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px] font-medium text-zinc-400">
                        <span className="flex items-center gap-1.5 font-mono text-[10px]">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                          CONFESTIVITY {confetti.length > 0 && `(${confetti.length})`}
                        </span>
                        <span className={`font-mono px-1.5 py-0.5 rounded text-[9px] shadow-2xs ${
                          darkMode ? 'text-zinc-100 bg-white/[0.04] border-white/[0.08] border' : 'text-zinc-700 bg-white border border-black/[0.08]'
                        }`}>
                          {(confettiActiveTime / 1000).toFixed(2)}s left
                        </span>
                      </div>
                      <div className={`h-1 rounded-full overflow-hidden ${darkMode ? 'bg-white/[0.06]' : 'bg-black/[0.06]'}`}>
                        <div
                          className="h-full bg-amber-400 transition-all duration-75 ease-linear rounded-full"
                          style={{ width: `${(confettiActiveTime / 5000) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

          </div>

          {/* Action Trigger Buttons Grid (Extended Column for Confetti Feature) */}
          <div className="space-y-3">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* 1. Trigger Snowflakes - Twice the size info displayed on hover */}
              <button
                onClick={triggerSnowflakes}
                className={`group flex items-center justify-center gap-2.5 px-5 py-4 rounded-xl text-[13px] font-semibold tracking-wide transition-all duration-300 border focus:outline-hidden focus:ring-2 focus:ring-sky-200 cursor-pointer ${
                  snowActiveTime > 0
                    ? 'bg-sky-500 border-sky-400 text-white font-bold shadow-sky-500/20 active:scale-97'
                    : (darkMode 
                        ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-zinc-100 hover:border-white/[0.15] active:scale-97 shadow-xs' 
                        : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white active:scale-97'
                      )
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className={`w-4 h-4 ${snowActiveTime > 0 ? 'animate-spin' : 'group-hover:rotate-45 transition-transform duration-500'}`}
                  style={{ animationDuration: '6s' }}
                >
                  <line x1="12" y1="2" x2="12" y2="22" strokeLinecap="round" />
                  <line x1="2" y1="12" x2="22" y2="12" strokeLinecap="round" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" strokeLinecap="round" />
                  <line x1="4.93" y1="19.07" x2="19.07" y2="4.93" strokeLinecap="round" />
                </svg>
                <span>Snowflakes (Double Size)</span>
              </button>

              {/* 2. Trigger Balloons */}
              <button
                onClick={triggerBalloons}
                className={`group flex items-center justify-center gap-2.5 px-5 py-4 rounded-xl text-[13px] font-semibold tracking-wide transition-all duration-300 border focus:outline-hidden focus:ring-2 focus:ring-rose-200 cursor-pointer ${
                  balloonsActiveTime > 0
                    ? 'bg-rose-500 border-rose-450 text-white font-bold shadow-rose-500/20 active:scale-97'
                    : (darkMode 
                        ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-zinc-100 hover:border-white/[0.15] active:scale-97 shadow-xs' 
                        : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white active:scale-97'
                      )
                }`}
              >
                <svg
                  viewBox="0 0 44 60"
                  fill="currentColor"
                  className={`w-3.5 h-4.5 ${balloonsActiveTime > 0 ? 'animate-bounce' : 'group-hover:-translate-y-1.5 transition-transform duration-300'}`}
                >
                  <path d="M22 2C11.5 2 3 10 3 20C3 32.5 14 44 22 46C30 44 41 32.5 41 20C41 10 32.5 2 22 2Z" />
                  <path d="M22 45L18 50H26L22 45Z" />
                </svg>
                <span>Balloons Upward</span>
              </button>
            </div>

            {/* 3. Confetti Celebration */}
            <button
              onClick={triggerConfetti}
              className={`group flex items-center justify-center gap-2.5 w-full px-5 py-4 rounded-xl text-[13px] font-semibold tracking-wide transition-all duration-300 border focus:outline-hidden focus:ring-2 focus:ring-amber-200 cursor-pointer ${
                confettiActiveTime > 0
                  ? 'bg-amber-500 border-amber-400 text-white font-bold shadow-amber-500/20 active:scale-97'
                  : (darkMode 
                      ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-zinc-100 hover:border-white/[0.15] active:scale-97' 
                      : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white active:scale-97'
                    )
              }`}
            >
              <Zap size={14} className={`${confettiActiveTime > 0 ? 'animate-pulse text-yellow-105' : 'group-hover:scale-120 group-hover:text-yellow-400 transition-colors'}`} />
              <span>Trigger Confetti Celebration</span>
            </button>

          </div>

          {/* Reset Action and Footer Info */}
          <div className="mt-5 flex flex-col items-center">
            
            {isAnyActive && (
              <button
                onClick={resetAll}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-rose-400 transition-colors duration-200 text-[11px] font-medium py-1.5 px-3.5 rounded-full hover:bg-rose-950/20 border border-transparent hover:border-rose-900/30 cursor-pointer animate-fade-in"
              >
                <Trash2 size={12} />
                <span>Reset Coordinates</span>
              </button>
            )}

            {!isAnyActive && (
              <div className={`flex items-center gap-1.5 text-[11px] font-medium py-1 transition-colors duration-500 ${
                darkMode ? 'text-zinc-500' : 'text-zinc-500'
              }`}>
                <Sparkles size={11} className="text-amber-400" />
                <span>Dynamic Glass Physics Console</span>
              </div>
            )}

            {/* Premium details block */}
            <div className={`text-[9px] font-mono tracking-widest text-center mt-5 uppercase border-t pt-4 w-full transition-colors duration-500 ${
              darkMode ? 'border-white/[0.06] text-zinc-500' : 'border-black/[0.06] text-zinc-450'
            }`}>
              Controller ver: 2.2.0 · Frosted Layer x0.45 · Twin Snowflake Size
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
