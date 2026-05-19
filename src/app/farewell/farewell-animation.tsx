'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './farewell.module.css';

const BRAND = 'ELEVATEOCO';
const LINES = ['Signing you out...', 'Saving your spot.', 'Take care.'];

export function FarewellAnimation({ name }: { name: string }) {
  const router = useRouter();
  const [lineIndex, setLineIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.3;

    // If the topbar already kicked off the descender during the sign-out click,
    // don't double up. Window is 3s — anything older was a stale flag.
    let alreadyStarted = false;
    try {
      const startedAt = Number(sessionStorage.getItem('descender-playing') ?? '0');
      if (startedAt && Date.now() - startedAt < 3000) {
        alreadyStarted = true;
        sessionStorage.removeItem('descender-playing');
      }
    } catch {}
    if (alreadyStarted) return;

    let unlocked = false;
    const tryPlay = () => {
      if (unlocked) return;
      const p = audio.play();
      if (p) {
        p.then(() => {
          unlocked = true;
        }).catch(() => {});
      }
    };
    tryPlay();
    const retry = window.setTimeout(tryPlay, 150);
    const onPointer = () => tryPlay();
    const onKey = () => tryPlay();
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(retry);
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    const cycle = window.setInterval(() => {
      setFading(true);
      window.setTimeout(() => {
        setLineIndex((i) => (i + 1) % LINES.length);
        setFading(false);
      }, 250);
    }, 1100);

    const navigate = window.setTimeout(() => {
      // Hand off to the public login page — set the transition flag so login fades in.
      try { sessionStorage.setItem('transition-in', '1'); } catch {}
      router.push('/login');
    }, 4200);

    return () => {
      window.clearInterval(cycle);
      window.clearTimeout(navigate);
    };
  }, [router]);

  const chars = [...BRAND];
  return (
    <div className={styles.root}>
      <div className={styles.aurora} />
      <main className={styles.stage}>
        <svg className={styles.mark} viewBox="0 0 64 64" aria-hidden="true">
          <defs>
            <linearGradient id="farewellMarkGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#9ec5ff" />
              <stop offset="100%" stopColor="#c89eff" />
            </linearGradient>
          </defs>
          <circle className={styles.ring} cx="32" cy="32" r="26" />
          <circle className={styles.dot} cx="32" cy="32" r="4" />
        </svg>

        <h1 className={styles.brand} aria-label={BRAND}>
          {chars.map((c, i) => (
            <span
              key={i}
              className={styles.ch}
              style={{ animationDelay: `${200 + (chars.length - 1 - i) * 60}ms` }}
            >
              {c}
            </span>
          ))}
        </h1>

        <div className={styles.underline} />

        <div className={styles.farewell}>
          See you soon{name ? `, ${name}` : ''}.
        </div>
        <div className={styles.sub} style={{ opacity: fading ? 0 : undefined }}>
          {LINES[lineIndex]}
        </div>
      </main>
      <audio ref={audioRef} src="/sounds/descender.mp3" preload="auto" />
      <div className={styles.blackout} />
    </div>
  );
}
