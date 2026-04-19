'use client';

/**
 * /admin/play — Direct Audio Test Player
 *
 * Zero-dependency: no edge functions, no database, no QC status required.
 * Plays audio directly from Supabase Storage public bucket URLs.
 *
 * HOW TO USE:
 *   1. Make sure your "tracks" bucket is set to PUBLIC in Supabase:
 *      Storage → tracks → bucket settings → Make public
 *   2. Visit /admin/play on your deployed site.
 *   3. Click any tile to play that file, or paste any full URL into the input.
 *
 * NOTE: NEXT_PUBLIC_SUPABASE_URL must be set in your Vercel environment variables.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/tracks`;

/** Every file the app currently expects in the tracks bucket. */
const KNOWN_FILES: { label: string; path: string }[] = [
  { label: 'kleigh--solace', path: 'kleigh--solace.mp3' },
  { label: 'perfect-day', path: 'perfect-day.mp3' },
  { label: 'wanna-know-you', path: 'wanna-know-you.mp3' },
  { label: 'jump', path: 'jump.mp3' },
  { label: 'kleigh--waterfall', path: 'kleigh--waterfall.mp3' },
  { label: 'kleigh--nightfall', path: 'kleigh--nightfall.mp3' },
];

export default function AdminPlayPage() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    function onPlay() { setPlaying(true); setError(null); setLoadingId(null); }
    function onPause() { setPlaying(false); }
    function onEnded() { setPlaying(false); }
    function onError() {
      setError('Could not load audio. Check: bucket is PUBLIC, file exists at this path, and NEXT_PUBLIC_SUPABASE_URL is set in Vercel.');
      setPlaying(false);
      setLoadingId(null);
    }

    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);
    el.addEventListener('error', onError);
    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('error', onError);
    };
  }, []);

  function playUrl(url: string, id: string) {
    const el = audioRef.current;
    if (!el) return;
    setError(null);
    setLoadingId(id);
    setCurrentUrl(url);
    el.src = url;
    void el.play().catch((e: Error) => {
      setError(`Playback blocked: ${e.message}`);
      setLoadingId(null);
    });
  }

  function stopAudio() {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setPlaying(false);
    setCurrentUrl('');
  }

  function playCustom() {
    const url = customUrl.trim();
    if (!url) return;
    playUrl(url, '__custom__');
  }

  return (
    <div className="min-h-screen bg-[#0e0a06] text-[#f5ede0]">
      <audio ref={audioRef} />

      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <Link href="/" className="text-[#D4A017] font-bold text-lg hover:opacity-80">
          ← K-KUT
        </Link>
        <span className="text-xs uppercase tracking-widest text-[#C8A882]">
          Admin · Direct Play
        </span>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-14 flex flex-col gap-10">

        {/* Title */}
        <div>
          <h1 className="text-3xl font-black text-[#D4A017] mb-2">Hear Your KUT</h1>
          <p className="text-sm text-[#C8A882] leading-7">
            Direct playback from the <code className="text-[#f0b16a]">tracks</code> bucket.
            No edge functions. No database. Just your audio.
          </p>
          {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
            <div className="mt-4 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
              ⚠ <strong>NEXT_PUBLIC_SUPABASE_URL</strong> is not set — audio URLs will be broken.
              Add it in Vercel → Project → Settings → Environment Variables, then redeploy.
            </div>
          )}
        </div>

        {/* Now playing bar */}
        {currentUrl && (
          <div className="rounded-xl border border-[#D4A017]/40 bg-[#1a120a] px-5 py-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-[#C8A882]">
                {playing ? '▶ Playing' : '⏸ Paused'}
              </span>
              <button
                onClick={stopAudio}
                className="text-xs text-[#C8A882] hover:text-white underline"
              >
                Stop
              </button>
            </div>
            <audio
              controls
              src={currentUrl}
              className="w-full rounded"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
            <p className="text-xs text-[#C8A882]/60 break-all">{currentUrl}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Known files */}
        <section>
          <h2 className="text-lg font-bold text-[#F5e6c8] mb-4">
            Files expected in your <code className="text-[#f0b16a]">tracks</code> bucket
          </h2>
          <div className="flex flex-col gap-3">
            {KNOWN_FILES.map(({ label, path }) => {
              const url = `${BASE}/${path}`;
              const isActive = currentUrl === url;
              const isLoading = loadingId === path;
              return (
                <div
                  key={path}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 transition ${
                    isActive
                      ? 'border-[#D4A017] bg-[#D4A017]/10'
                      : 'border-white/10 bg-[#111]'
                  }`}
                >
                  <div>
                    <p className={`font-semibold ${isActive ? 'text-[#D4A017]' : 'text-[#F5e6c8]'}`}>
                      {label}
                    </p>
                    <p className="text-xs text-[#C8A882]/60 mt-0.5 font-mono">{path}</p>
                  </div>
                  <button
                    onClick={() => isActive && playing ? stopAudio() : playUrl(url, path)}
                    className={`ml-4 shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                      isActive && playing
                        ? 'bg-[#D4A017] text-[#0e0a06]'
                        : 'bg-[#2a1c10] text-[#f0b16a] border border-[#D4A017]/30 hover:bg-[#3a2615]'
                    }`}
                  >
                    {isLoading ? '…' : isActive && playing ? '⏸ Pause' : '▶ Play'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Custom URL */}
        <section>
          <h2 className="text-lg font-bold text-[#F5e6c8] mb-2">Play any URL</h2>
          <p className="text-xs text-[#C8A882] mb-4">
            Paste a full Supabase Storage URL or any direct MP3 link.
          </p>
          <div className="flex gap-3">
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') playCustom(); }}
              placeholder={`${BASE}/your-file.mp3`}
              className="flex-1 rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-[#f5ede0] placeholder-[#C8A882]/40 outline-none focus:border-[#D4A017]/60"
            />
            <button
              onClick={playCustom}
              disabled={!customUrl.trim()}
              className="rounded-xl bg-[#D4A017] px-5 py-3 font-bold text-[#0e0a06] hover:bg-[#f0c030] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Play
            </button>
          </div>
        </section>

        {/* Checklist */}
        <section className="rounded-xl border border-white/10 bg-[#111] px-5 py-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#C8A882] mb-4">
            If audio is not playing — check these
          </h2>
          <ol className="flex flex-col gap-3 text-sm leading-7 text-[#C8A882]">
            <li>
              <span className="text-[#D4A017] font-bold">1.</span>{' '}
              Supabase → Storage → <strong className="text-[#F5e6c8]">tracks</strong> bucket →
              {' '}bucket settings → <strong className="text-[#F5e6c8]">Make public</strong>
            </li>
            <li>
              <span className="text-[#D4A017] font-bold">2.</span>{' '}
              Vercel → Project → Settings → Environment Variables →
              set <code className="text-[#f0b16a]">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
              <code className="text-[#f0b16a]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> → Redeploy
            </li>
            <li>
              <span className="text-[#D4A017] font-bold">3.</span>{' '}
              Upload your audio files to the <strong className="text-[#F5e6c8]">tracks</strong> bucket
              {' '}with the exact filenames shown above
            </li>
            <li>
              <span className="text-[#D4A017] font-bold">4.</span>{' '}
              Verify one file directly in a browser tab:
              <br />
              <code className="text-[#f0b16a] text-xs break-all">
                {BASE}/kleigh--solace.mp3
              </code>
            </li>
          </ol>
        </section>

      </main>

      <footer className="border-t border-white/10 px-6 py-6 text-center text-xs text-[#C8A882]">
        K-KUT is a{' '}
        <a href="https://gputnammusic.com" className="text-[#D4A017] hover:underline">
          G Putnam Music
        </a>{' '}
        invention. All rights reserved.
      </footer>
    </div>
  );
}
