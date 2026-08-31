import { useEffect, useRef, useState } from 'react';
import type Phaser from 'phaser';

// Dynamic import: Phaser cuma di-load saat tombol game diklik,
// landing page tetap ringan (tanpa 1.5MB Phaser di bundle awal).
const startFairyGameAsync = () =>
  import('../game').then((m) => m.startFairyGame);

// Modal game: peri mencari stardust di hutan ajaib
export default function FairyGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // cleanup saat unmount
  useEffect(() => {
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  const openGame = async () => {
    setOpen(true);
    setLoading(true);
    try {
      const start = await startFairyGameAsync();
      // tunggu container siap
      requestAnimationFrame(() => {
        if (containerRef.current && !gameRef.current) {
          gameRef.current = start(containerRef.current);
        }
        setLoading(false);
      });
    } catch (err) {
      console.error('Gagal load game:', err);
      setLoading(false);
    }
  };

  const closeGame = () => {
    gameRef.current?.destroy(true);
    gameRef.current = null;
    setOpen(false);
  };

  return (
    <>
      {/* tombol masuk game - di landing */}
      <button
        onClick={openGame}
        className="mt-10 px-8 py-3.5 rounded-full border border-gold/50 text-gold text-sm tracking-wide hover:bg-gold hover:text-ink transition-colors duration-300"
      >
        ✦ Mainkan Petualangan Peri
      </button>

      {/* modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            // klik luar = tutup
            if (e.target === e.currentTarget) closeGame();
          }}
        >
          <div className="relative w-full max-w-[680px]">
            {/* header */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-gold text-[10px] uppercase tracking-[0.3em]">
                ✦ Hutan Ajaib: Petualangan Peri
              </div>
              <button
                onClick={closeGame}
                className="text-cream/60 hover:text-cream text-sm border border-cream/20 rounded-full px-3 py-1 transition-colors"
              >
                ✕ Tutup
              </button>
            </div>

            {/* game container */}
            <div
              ref={containerRef}
              className="w-full rounded-2xl overflow-hidden border border-cream/15 shadow-[0_30px_80px_rgba(0,0,0,0.6)] bg-[#0d1b2a]"
              style={{ aspectRatio: '640/600', minHeight: '400px' }}
            >
              {loading && (
                <div className="w-full h-full flex items-center justify-center text-cream/60 text-sm tracking-widest">
                  ✦ Menyiapkan hutan ajaib...
                </div>
              )}
            </div>

            {/* kontrol info */}
            <div className="mt-3 text-center text-cream/50 text-xs tracking-wide">
              ← → gerak · ↑ lompat (2x = double jump) · Shift = dash · R = restart
            </div>
          </div>
        </div>
      )}
    </>
  );
}