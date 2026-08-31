import React, { useEffect, useRef, useState } from 'react';
import type * as Phaser from 'phaser';
import type { GameStateEvent } from '../game/scenes/MainScene';
import type { MainScene as MainSceneType } from '../game/scenes/MainScene';

// Dynamic import: Phaser + MainScene di-load hanya saat game dibuka,
// landing page tetap ringan.
const loadGameModule = () =>
  import('../game/PhaserGame').then((m) => m.createPhaserGame);

interface FairyGameProps {
  onClose?: () => void;
}

export const FairyGame: React.FC<FairyGameProps> = ({ onClose }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerId = 'fairy-game-canvas-container';

  const [isPlaying, setIsPlaying] = useState(false);
  const [gameState, setGameState] = useState<GameStateEvent>({
    health: 3,
    maxHealth: 3,
    stardust: 0,
    stardustRequired: 5,
    score: 0,
    level: 1,
    isPortalOpen: false,
    status: 'playing',
  });

  const [isMuted, setIsMuted] = useState(false); // audio mulai nyala; toggle via scene
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;

    // Prevent default touch scrolling for game container
    const preventTouch = (e: TouchEvent) => {
      if ((e.target as HTMLElement)?.closest(`#${containerId}`)) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchmove', preventTouch, { passive: false });

    // Initialize Phaser game (dynamic import biar bundle utama ringan)
    let cancelled = false;
    loadGameModule()
      .then((createGame) => {
        if (cancelled) return;
        const game = createGame(containerId, (newState: GameStateEvent) => {
          setGameState(newState);
        });
        gameRef.current = game;
      })
      .catch((err) => {
        console.error('Gagal load game:', err);
      });

    return () => {
      document.removeEventListener('touchmove', preventTouch);
      cancelled = true;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [isPlaying]);

  const getScene = (): MainSceneType | null => {
    if (!gameRef.current) return null;
    return gameRef.current.scene.getScene('MainScene') as MainSceneType;
  };

  const handleRestart = () => {
    const scene = getScene();
    if (scene) {
      scene.restartCurrentLevel();
    }
  };

  const handleNextLevel = () => {
    const scene = getScene();
    if (scene) {
      scene.nextLevel();
    }
  };

  const handleToggleMute = () => {
    setIsMuted((m: boolean) => {
      const next = !m;
      // mute/unmute audio game via scene kalau ada
      const scene = getScene();
      if (scene && 'toggleMuteAudio' in scene) {
        (scene as unknown as { toggleMuteAudio: () => void }).toggleMuteAudio();
      }
      return next;
    });
  };

  // On-Screen touch control triggers
  const handleTouchLeft = (active: boolean) => {
    const scene = getScene();
    if (!scene) return;
    const cursors = scene['cursors'];
    if (cursors) cursors.left.isDown = active;
  };

  const handleTouchRight = (active: boolean) => {
    const scene = getScene();
    if (!scene) return;
    const cursors = scene['cursors'];
    if (cursors) cursors.right.isDown = active;
  };

  const handleTouchJump = () => {
    const scene = getScene();
    if (scene) scene.jumpOrFlutter();
  };

  const handleTouchShoot = () => {
    const scene = getScene();
    if (scene) scene.shootMagic();
  };

  const handleTouchDash = () => {
    const scene = getScene();
    if (scene) scene.dash();
  };

  const handleExitGame = () => {
    setIsPlaying(false);
    if (onClose) onClose();
  };

  const getLevelTitle = (lvl: number) => {
    switch (lvl) {
      case 1:
        return 'Hutan Pembuka (Whispering Woods)';
      case 2:
        return 'Puncak Pohon Raksasa (Twilight Canopy)';
      case 3:
        return 'Hutan Kristal Ajaib (Crystal Grove)';
      default:
        return `Level ${lvl}`;
    }
  };

  // If game is not active yet, show a preview card with CTA button to start
  if (!isPlaying) {
    return (
      <div className="relative mt-10 overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-b from-[#16122b] via-[#0d0a1a] to-[#070b19] p-6 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] text-left">
        {/* Background ambient glow & artwork */}
        <div className="absolute -right-10 -top-10 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-72 h-72 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Character & Forest Art Preview */}
          <div className="lg:col-span-5 relative group">
            <div className="relative rounded-2xl overflow-hidden border border-white/20 aspect-[4/3] bg-black/60 shadow-2xl">
              <img
                src="/assets/game/bg.jpeg"
                alt="Enchanted Forest"
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />
              <img
                src="/assets/game/caracter.jpeg"
                alt="Fairy Character"
                className="absolute inset-0 m-auto w-36 h-36 object-contain rounded-full border-2 border-gold/60 shadow-[0_0_25px_rgba(226,178,124,0.6)] animate-pulse"
              />
              <div className="absolute bottom-3 left-4 right-4 flex justify-between items-center text-[11px] font-semibold text-gold uppercase tracking-wider">
                <span>✦ Peri Kurnia</span>
                <span>3 Level Hutan ✦</span>
              </div>
            </div>
          </div>

          {/* Features & Launch Button */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-semibold uppercase tracking-wider w-fit mb-3">
              <span>🎮</span>
              <span>2D Action-Platformer (Mario / Contra Style)</span>
            </div>

            <h3 className="text-2xl md:text-3xl font-serif font-medium text-white tracking-tight">
              Jelajahi Hutan Ajaib & Kumpulkan Stardust
            </h3>

            <p className="text-sm text-cream/70 mt-2 leading-relaxed">
              Kendalikan peri kecil bersayap bercahaya untuk melompati jamur raksasa, melayang dengan daun membal, meluncur cepat (*dash*), dan lepaskan tembakan sihir bintang untuk membuka gerbang dimensi!
            </p>

            {/* Feature Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-5">
              <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
                <div className="text-pink-300 font-bold text-xs flex items-center gap-1.5">
                  <span>🪽</span> Flutter & Jump
                </div>
                <div className="text-[11px] text-cream/50 mt-0.5">Lompat 2x & melayang</div>
              </div>
              <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
                <div className="text-cyan-300 font-bold text-xs flex items-center gap-1.5">
                  <span>✨</span> Tembak Sihir
                </div>
                <div className="text-[11px] text-cream/50 mt-0.5">Kalahkan musuh hutan</div>
              </div>
              <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl col-span-2 sm:col-span-1">
                <div className="text-amber-300 font-bold text-xs flex items-center gap-1.5">
                  <span>⚡</span> Glitter Dash
                </div>
                <div className="text-[11px] text-cream/50 mt-0.5">Meluncur cepat & kebal</div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={() => setIsPlaying(true)}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-gold via-amber-300 to-yellow-500 hover:from-yellow-400 hover:to-amber-300 text-ink font-bold text-sm uppercase tracking-wider rounded-2xl shadow-[0_0_30px_rgba(226,178,124,0.5)] hover:shadow-[0_0_40px_rgba(226,178,124,0.8)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Mulai Petualangan</span>
                <span>➔</span>
              </button>
              <span className="text-xs text-cream/40">
                Desktop & Mobile Friendly (Tanpa Install)
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Fullscreen Game Experience
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#070b19] select-none overflow-hidden font-sans text-white">
      {/* Phaser Canvas Container */}
      <div id={containerId} className="absolute inset-0 w-full h-full" />

      {/* TOP HUD OVERLAY */}
      <header className="relative z-20 flex items-center justify-between p-4 md:p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
        {/* Left Side: Health & Stardust */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Health Hearts */}
          <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-pink-500/30 shadow-lg">
            <span className="text-xs font-bold text-pink-300 uppercase tracking-wider mr-1">Nyawa:</span>
            {Array.from({ length: gameState.maxHealth }).map((_, idx) => (
              <span
                key={idx}
                className={`text-lg transition-transform duration-300 ${
                  idx < gameState.health
                    ? 'text-pink-500 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                    : 'text-gray-600 scale-90 opacity-40'
                }`}
              >
                ❤️
              </span>
            ))}
          </div>

          {/* Stardust Progress */}
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-yellow-500/30 shadow-lg">
            <span className="text-yellow-400 text-base animate-pulse">⭐</span>
            <div className="flex flex-col">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold text-yellow-200">
                <span>Stardust</span>
                <span className="ml-2 font-mono text-xs text-yellow-300">
                  {gameState.stardust} / {gameState.stardustRequired}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-24 md:w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden mt-0.5 border border-yellow-500/20">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-amber-300 transition-all duration-300 shadow-[0_0_10px_rgba(250,204,21,0.8)]"
                  style={{
                    width: `${Math.min(100, (gameState.stardust / gameState.stardustRequired) * 100)}%`,
                  }}
                />
              </div>
            </div>
            {gameState.isPortalOpen && (
              <span className="ml-1 text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 px-2 py-0.5 rounded-full animate-bounce">
                Portal Terbuka! 🌀
              </span>
            )}
          </div>
        </div>

        {/* Center: Level Title */}
        <div className="hidden md:flex flex-col items-center">
          <div className="text-xs uppercase tracking-widest text-cyan-300 font-bold bg-black/40 backdrop-blur-md px-4 py-1 rounded-full border border-cyan-500/30">
            {getLevelTitle(gameState.level)}
          </div>
        </div>

        {/* Right Side: Score, Help, Mute, Exit */}
        <div className="flex items-center gap-2 md:gap-3 pointer-events-auto">
          <div className="bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-purple-500/30 text-xs md:text-sm font-mono font-bold text-purple-200 shadow-lg">
            Score: <span className="text-purple-300">{gameState.score}</span>
          </div>

          <button
            onClick={() => setShowHelp(true)}
            title="Bantuan Kontrol"
            className="p-2 bg-black/50 backdrop-blur-md hover:bg-white/10 rounded-full border border-white/20 text-white text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            ❓
          </button>

          <button
            onClick={handleToggleMute}
            title={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
            className="p-2 bg-black/50 backdrop-blur-md hover:bg-white/10 rounded-full border border-white/20 text-white text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          <button
            onClick={handleExitGame}
            title="Keluar ke Halaman Utama"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 active:bg-rose-500/40 rounded-full border border-rose-500/40 text-rose-200 text-xs font-semibold backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>✕</span>
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* MOBILE / ON-SCREEN TOUCH CONTROLS */}
      <div className="relative z-20 mt-auto flex justify-between items-end p-4 md:p-6 pointer-events-none md:hidden">
        {/* Left/Right D-Pad */}
        <div className="flex gap-2 pointer-events-auto">
          <button
            onTouchStart={() => handleTouchLeft(true)}
            onTouchEnd={() => handleTouchLeft(false)}
            onMouseDown={() => handleTouchLeft(true)}
            onMouseUp={() => handleTouchLeft(false)}
            className="w-14 h-14 bg-white/15 backdrop-blur-lg active:bg-white/30 rounded-2xl border border-white/30 flex items-center justify-center text-xl text-white font-bold shadow-xl active:scale-90 select-none"
          >
            ◀
          </button>
          <button
            onTouchStart={() => handleTouchRight(true)}
            onTouchEnd={() => handleTouchRight(false)}
            onMouseDown={() => handleTouchRight(true)}
            onMouseUp={() => handleTouchRight(false)}
            className="w-14 h-14 bg-white/15 backdrop-blur-lg active:bg-white/30 rounded-2xl border border-white/30 flex items-center justify-center text-xl text-white font-bold shadow-xl active:scale-90 select-none"
          >
            ▶
          </button>
        </div>

        {/* Action Buttons (Jump, Dash, Shoot) */}
        <div className="flex gap-2 items-center pointer-events-auto">
          {/* Dash */}
          <button
            onClick={handleTouchDash}
            className="w-12 h-12 bg-amber-500/25 active:bg-amber-500/45 border border-amber-400/50 rounded-full flex items-center justify-center text-amber-200 text-lg shadow-lg active:scale-90"
            title="Dash"
          >
            ⚡
          </button>
          {/* Shoot */}
          <button
            onClick={handleTouchShoot}
            className="w-14 h-14 bg-cyan-500/25 active:bg-cyan-500/45 border border-cyan-400/50 rounded-full flex items-center justify-center text-cyan-200 text-xl shadow-lg active:scale-90"
            title="Tembak Sihir"
          >
            ✨
          </button>
          {/* Jump / Flutter */}
          <button
            onClick={handleTouchJump}
            className="w-16 h-16 bg-pink-500/30 active:bg-pink-500/50 border border-pink-400/60 rounded-full flex items-center justify-center text-pink-200 text-2xl shadow-xl active:scale-90"
            title="Lompat / Melayang"
          >
            🪽
          </button>
        </div>
      </div>

      {/* MODAL: LEVEL COMPLETE */}
      {gameState.status === 'levelcomplete' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-gradient-to-b from-[#1a1438] to-[#0d0a21] border border-cyan-500/40 p-8 rounded-3xl max-w-md w-full text-center shadow-[0_0_50px_rgba(34,211,238,0.3)] flex flex-col items-center">
            <div className="text-5xl mb-2 animate-bounce">🌀✨</div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-pink-300 to-yellow-300">
              Level Selesai!
            </h2>
            <p className="text-sm text-gray-300 mt-2 mb-4">
              Peri berhasil mengumpulkan seluruh stardust dan melewati gerbang dimensi!
            </p>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 w-full mb-6 flex justify-around">
              <div>
                <div className="text-xs text-gray-400 uppercase font-semibold">Level Selesai</div>
                <div className="text-xl font-bold text-cyan-300">{gameState.level}</div>
              </div>
              <div className="border-r border-white/10" />
              <div>
                <div className="text-xs text-gray-400 uppercase font-semibold">Total Skor</div>
                <div className="text-xl font-bold text-yellow-300">{gameState.score}</div>
              </div>
            </div>

            <button
              onClick={handleNextLevel}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-white font-bold rounded-2xl shadow-lg transition-all cursor-pointer"
            >
              Lanjut ke Level {gameState.level + 1} ➔
            </button>
          </div>
        </div>
      )}

      {/* MODAL: ALL LEVELS VICTORY */}
      {gameState.status === 'victory' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-gradient-to-b from-[#2e1065] to-[#0f172a] border border-yellow-400/50 p-8 rounded-3xl max-w-md w-full text-center shadow-[0_0_60px_rgba(250,204,21,0.4)] flex flex-col items-center">
            <div className="text-6xl mb-2 animate-bounce">👑🧚‍♀️✨</div>
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-pink-300">
              Selamat! Kamu Menang!
            </h2>
            <p className="text-sm text-gray-300 mt-2 mb-6">
              Hutan Ajaib kini telah kembali bersinar berkat keberanian Peri Kurnia!
            </p>

            <div className="bg-black/50 border border-yellow-500/30 rounded-2xl p-4 w-full mb-6">
              <div className="text-xs text-yellow-300 uppercase font-semibold">Skor Akhir</div>
              <div className="text-4xl font-extrabold text-yellow-400 font-mono mt-1">
                {gameState.score}
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={handleRestart}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-semibold transition-all border border-white/20 cursor-pointer"
              >
                Main Lagi 🔄
              </button>
              <button
                onClick={handleExitGame}
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 rounded-xl text-white font-bold transition-all shadow-lg cursor-pointer"
              >
                Kembali ke Menu 🏠
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GAME OVER */}
      {gameState.status === 'gameover' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-gradient-to-b from-[#3b0716] to-[#0f172a] border border-rose-500/40 p-8 rounded-3xl max-w-md w-full text-center shadow-[0_0_50px_rgba(244,63,94,0.3)] flex flex-col items-center">
            <div className="text-5xl mb-2">🥀</div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-rose-400">
              Peri Kehabisan Tenaga
            </h2>
            <p className="text-sm text-gray-300 mt-2 mb-6">
              Jangan menyerah! Hutan ajaib masih membutuhkan keajaibanmu.
            </p>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleRestart}
                className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 active:scale-95 text-white font-bold rounded-2xl shadow-lg transition-all cursor-pointer"
              >
                Coba Lagi 🔁
              </button>
              <button
                onClick={handleExitGame}
                className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-gray-300 font-semibold border border-white/10 transition-all cursor-pointer"
              >
                Kembali ke Beranda 🏠
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONTROLS HELP */}
      {showHelp && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-[#11162b] border border-white/20 p-6 md:p-8 rounded-3xl max-w-md w-full shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🎮</span> Panduan Kontrol
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-gray-400 hover:text-white text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-gray-200">
              <div className="flex items-center justify-between bg-white/5 p-2.5 rounded-xl border border-white/5">
                <span className="text-gray-300">Bergerak Kiri / Kanan</span>
                <span className="font-mono bg-white/10 px-2 py-1 rounded text-xs font-semibold text-cyan-300">
                  A / D atau Panah ◀ ▶
                </span>
              </div>
              <div className="flex items-center justify-between bg-white/5 p-2.5 rounded-xl border border-white/5">
                <span className="text-gray-300">Lompat / Double Jump</span>
                <span className="font-mono bg-white/10 px-2 py-1 rounded text-xs font-semibold text-cyan-300">
                  Spasi / W / ⬆️
                </span>
              </div>
              <div className="flex items-center justify-between bg-white/5 p-2.5 rounded-xl border border-white/5">
                <span className="text-gray-300">Melayang (Flutter / Glide)</span>
                <span className="font-mono bg-white/10 px-2 py-1 rounded text-xs font-semibold text-pink-300">
                  Tahan Spasi di udara 🪽
                </span>
              </div>
              <div className="flex items-center justify-between bg-white/5 p-2.5 rounded-xl border border-white/5">
                <span className="text-gray-300">Dash (Cepat Meluncur)</span>
                <span className="font-mono bg-white/10 px-2 py-1 rounded text-xs font-semibold text-amber-300">
                  Shift / Z / K ⚡
                </span>
              </div>
              <div className="flex items-center justify-between bg-white/5 p-2.5 rounded-xl border border-white/5">
                <span className="text-gray-300">Tembak Sihir</span>
                <span className="font-mono bg-white/10 px-2 py-1 rounded text-xs font-semibold text-cyan-300">
                  X / J atau Klik Mouse ✨
                </span>
              </div>
              <div className="flex items-center justify-between bg-white/5 p-2.5 rounded-xl border border-white/5">
                <span className="text-gray-300">Daun Membal (Trampolin)</span>
                <span className="text-xs text-green-300">
                  Injak daun hijau untuk melompat tinggi! 🍃
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="mt-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition-all cursor-pointer"
            >
              Mengerti & Lanjut Main
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FairyGame;