import { useEffect, useRef, useState } from 'react';
import FairyGame from './components/FairyGame';

/* ================================================================== */
/*  KONFIGURASI BIOGRAFI                                                */
/*  Ganti teks di sini dengan data asli Kurnia / Nia.                   */
/*  Foto: taruh di /public/photos/*.jpg lalu isi src di bawah.          */
/* ================================================================== */
const PHOTOS = {
  hero: null as string | null,          // ex: '/photos/hero.jpg'
  prologue: '/photos/malam-downtown.jpg', // foto candid (kiri)
  gallery: {
    one: '/photos/malam-downtown.jpg',  // ex: '/photos/gallery-1.jpg'
    two: '/photos/pantai-bali.jpg',
    three: '/photos/ultah-kurnia.jpg',
    four: '/photos/touring-jalan.jpg',
    five: '/photos/buket-bunga.jpg',
    six: '/photos/taman-hydrangea.jpg',
  },
};

const BIO = {
  name: 'Nia',
  fullName: 'I Gusti Ayu Kurnia Dwi Damarayatna',
  headline: 'The Story of Nia: A Journey of Warmth, Laughter, and Us.',
  subheadline:
    'Sebuah ruang kecil untuk merayakan sosok terbaik, setiap tawa sederhana, dan petualangan yang kita bagi bersama.',
  cta: 'Baca Cerita Kita',
  prologueTitle: 'Sosok di Balik Senyuman',
  prologue:
    'Nia, atau I Gusti Ayu Kurnia Dwi Damarayatna, lahir di Bali pada 2 Oktober 1999. Sosok kekasih yang menjadi rekan perjalanan, pendukung utama, dan teman berbagi cerita dalam keseharian. Dari berbagai momen dan kenangan bersama, halaman ini merangkum perjalanan sosok yang selalu membawa warna di setiap langkah.',
  loves: [
    { icon: '♫', title: 'Music & Melodies', text: 'Menikmati riuhnya konser dan dentuman musik favorit.' },
    { icon: '↝', title: 'The Road & The Wind', text: 'Menyusuri jalanan Jawa Timur dan suasana Bali lewat touring santai.' },
    { icon: '☕', title: 'Simple Comforts', text: 'Menemukan tempat makan enak dan obrolan panjang tanpa akhir.' },
  ],
  chapters: [
    {
      title: 'Awal Cerita',
      subtitle: 'Chapter I',
      text: 'Momen pertama kali cerita ini dimulai, percakapan awal, dan rasa canggung yang manis.',
      photo: null as string | null,
    },
    {
      title: 'Melodi & Konser',
      subtitle: 'Chapter II',
      text: 'Saat bernyanyi bersama di tengah ribuan penonton festival musik, berbagi euforia lagu favorit.',
      photo: '/photos/malam-downtown.jpg',
    },
    {
      title: 'Menjelajah Aspal',
      subtitle: 'Chapter III',
      text: 'Cerita tentang kilometer yang dilalui bersama, touring santai menyusuri jalanan Jawa Timur hingga suasana Bali, angin perjalanan, dan tempat-tempat baru yang disinggahi.',
      photo: '/photos/touring-jalan.jpg',
    },
    {
      title: 'Rutinitas yang Bermakna',
      subtitle: 'Chapter IV',
      text: 'Momen makan bersama, tawa receh, merayakan hari ulang tahun hingga momen kelulusan, dan saling mendukung mimpi masing-masing.',
      photo: '/photos/ultah-kurnia.jpg',
    },
  ],
  galleryCaptions: [
    'Downtown Social Bar, malam itu.',
    'Senja di pantai Bali.',
    'Happy Birthday, Kurnia.',
    'Siap touring, jalanan menyapa.',
    'Buket bunga untuk hari spesialmu.',
    'Di antara hydrangea, senyummu yang paling indah.',
  ],
  epilogue:
    'Terima kasih sudah menjadi rumah, teman bertualang, dan alasan untuk selalu tersenyum setiap hari. Bab-bab terbaik kita masih terus ditulis, dan aku tidak sabar untuk melewati semuanya bersamamu.',
  footer: 'Handcrafted with ♥ for Kurnia',
};

/* ================================================================== */

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const targetTimeRef = useRef(0);
  const currentTimeRef = useRef(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Reveal on scroll
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Video scrub by mouse X — hanya desktop. Mobile/touch: autoplay loop natural.
  useEffect(() => {
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) return;

    const handlePointerMove = (e: PointerEvent) => {
      const progress = e.clientX / window.innerWidth;
      if (videoRef.current && !isNaN(videoRef.current.duration)) {
        targetTimeRef.current = progress * videoRef.current.duration;
      }
    };
    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  useEffect(() => {
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    let animationFrameId: number;
    const loop = () => {
      if (videoRef.current && isLoaded) {
        const video = videoRef.current;
        if (!isTouch) {
          const target = targetTimeRef.current;
          let current = currentTimeRef.current;
          current += (target - current) * 0.08;
          currentTimeRef.current = current;
          if (Math.abs(video.currentTime - current) > 0.01) {
            video.currentTime = current;
          }
        }
      }
      animationFrameId = requestAnimationFrame(loop);
    };
    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isLoaded]);

  const handleLoadedMetadata = () => {
    setIsLoaded(true);
    // Desktop: mulai dari tengah (basis scrub). Mobile: play natural (loop).
    if (videoRef.current) {
      const isTouch = window.matchMedia('(pointer: coarse)').matches;
      if (isTouch) {
        videoRef.current.play().catch(() => {});
      } else {
        targetTimeRef.current = videoRef.current.duration / 2;
        currentTimeRef.current = videoRef.current.duration / 2;
        videoRef.current.currentTime = currentTimeRef.current;
      }
    }
  };

  const scrollToStory = () => {
    document.getElementById('prologue')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="bg-ink text-cream selection:bg-gold/30">
      {/* ============ 1. HERO (video scrub + soft overlay) ============ */}
      <section className="relative w-full h-[100svh] overflow-hidden bg-black">
        <video
          ref={videoRef}
          src="/bg-video.mp4"
          preload="auto"
          muted
          loop
          autoPlay
          playsInline
          onLoadedMetadata={handleLoadedMetadata}
          aria-label="The Story of Nia"
          className="absolute inset-0 w-full h-full object-cover scale-105 pointer-events-none opacity-70"
          style={{ transformOrigin: 'center center' }}
        />
        {/* soft overlay hangat */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/75 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-center items-center w-full h-full p-6 text-center">
          <div className="animate-nature-reveal opacity-0 delay-100 text-[10px] md:text-xs uppercase tracking-[0.35em] text-gold mb-6">
            Sebuah kisah untuk
          </div>
          <h1 className="font-serif text-5xl md:text-8xl lg:text-9xl font-medium tracking-tight leading-none drop-shadow-2xl animate-nature-reveal opacity-0 delay-300">
            Nia
          </h1>
          <div className="mt-4 text-[10px] md:text-xs uppercase tracking-[0.3em] text-cream/60 animate-nature-reveal opacity-0 delay-400">
            {BIO.fullName}
          </div>
          <p className="mt-6 max-w-2xl font-serif text-lg md:text-2xl italic text-cream/85 animate-nature-reveal opacity-0 delay-500">
            {BIO.headline}
          </p>
          <p className="mt-3 max-w-xl text-sm md:text-base text-cream/60 leading-relaxed animate-nature-reveal opacity-0 delay-700">
            {BIO.subheadline}
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-10 animate-nature-reveal opacity-0 delay-700">
            <button
              onClick={scrollToStory}
              className="px-8 py-3.5 rounded-full border border-gold/50 text-gold text-sm tracking-wide hover:bg-gold hover:text-ink transition-colors duration-300 cursor-pointer"
            >
              {BIO.cta} ↓
            </button>
            <button
              onClick={() => document.getElementById('game')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-gold/30 via-amber-300/30 to-yellow-500/30 hover:from-gold hover:via-amber-300 hover:to-yellow-500 text-gold hover:text-ink border border-gold/60 text-sm tracking-wide font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(226,178,124,0.3)] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🎮 Mainkan Game Peri</span>
              <span>➔</span>
            </button>
          </div>
        </div>

        {/* scroll hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-cream/50 text-[10px] uppercase tracking-[0.3em]">
          <span>Scroll</span>
          <span className="w-px h-8 bg-cream/30 animate-pulse" />
        </div>
      </section>

      {/* ============ 2. PROLOGUE (About Her) ============ */}
      <section id="prologue" className="relative z-10 bg-ink py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* kiri: foto */}
          <div className="reveal">
            {PHOTOS.prologue ? (
              <div className="rounded-2xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
                <img src={PHOTOS.prologue} alt="Nia" className="w-full aspect-[4/5] object-cover" />
              </div>
            ) : (
              <div className="rounded-2xl bg-ink-soft border border-cream/10 aspect-[4/5] flex items-center justify-center">
                <span className="text-cream/30 text-sm">Foto Nia (placeholder)</span>
              </div>
            )}
          </div>

          {/* kanan: narasi */}
          <div>
            <div className="reveal text-gold text-[10px] uppercase tracking-[0.3em] mb-4">The Prologue</div>
            <h2 className="reveal font-serif text-3xl md:text-5xl tracking-tight leading-tight">
              {BIO.prologueTitle}
            </h2>
            <p className="reveal mt-6 text-cream/75 leading-relaxed text-base md:text-lg max-w-xl">
              {BIO.prologue}
            </p>

            {/* little things she loves */}
            <div className="mt-10 space-y-4">
              {BIO.loves.map((l, i) => (
                <div
                  key={l.title}
                  className="reveal flex items-start gap-4 p-4 rounded-xl bg-ink-card/50 border border-cream/8"
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <span className="text-gold text-xl leading-none mt-0.5">{l.icon}</span>
                  <div>
                    <div className="font-semibold text-sm tracking-wide">{l.title}</div>
                    <div className="text-cream/60 text-sm mt-1">{l.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ 3. TIMELINE CHAPTERS ============ */}
      <section id="perjalanan" className="bg-ink py-24 md:py-32 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="reveal text-gold text-[10px] uppercase tracking-[0.3em] mb-4 text-center">Our Milestones</div>
          <h2 className="reveal font-serif text-3xl md:text-5xl tracking-tight text-center">
            Jejak Petualangan
          </h2>

          <div className="relative mt-16 md:mt-20">
            {/* garis tengah */}
            <div className="timeline-line absolute left-4 md:left-1/2 top-0 bottom-0 w-px md:-translate-x-1/2" />

            <div className="space-y-14 md:space-y-20">
              {BIO.chapters.map((c, i) => (
                <div
                  key={c.title}
                  className={`relative grid md:grid-cols-2 gap-4 md:gap-16 items-center ${
                    i % 2 ? '' : ''
                  }`}
                >
                  {/* node */}
                  <div className="absolute left-4 md:left-1/2 top-6 w-3 h-3 rounded-full bg-gold -translate-x-1/2 shadow-[0_0_12px_rgba(226,178,124,0.6)]" />

                  {/* foto (alternate) */}
                  {c.photo ? (
                    <div className={`reveal ${i % 2 ? 'md:order-2 md:col-start-1' : 'md:col-start-2'} pl-10 md:pl-0`}>
                      <div className="rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
                        <img src={c.photo} alt={c.title} className="w-full aspect-[4/3] object-cover" />
                      </div>
                    </div>
                  ) : (
                    <div className={`reveal ${i % 2 ? 'md:col-start-2' : ''} pl-10 md:pl-0`}>
                      <div className="rounded-xl bg-ink-soft border border-cream/10 aspect-[4/3] flex items-center justify-center">
                        <span className="text-cream/30 text-sm">Foto chapter {i + 1}</span>
                      </div>
                    </div>
                  )}

                  {/* teks */}
                  <div className={`reveal ${i % 2 ? 'md:col-start-1 md:text-right' : 'md:col-start-2'} pl-10 md:pl-0 ${c.photo ? (i % 2 ? 'md:order-1' : '') : ''}`}>
                    <div className="text-gold text-[10px] uppercase tracking-[0.3em]">{c.subtitle}</div>
                    <h3 className="font-serif text-2xl md:text-3xl mt-2 tracking-tight">{c.title}</h3>
                    <p className={`mt-3 text-cream/65 leading-relaxed ${i % 2 ? 'md:ml-auto' : ''} max-w-md`}>
                      {c.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ 4. POLAROID GALLERY ============ */}
      <section id="galeri" className="bg-ink py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="reveal text-gold text-[10px] uppercase tracking-[0.3em] mb-4 text-center">Scrapbook</div>
          <h2 className="reveal font-serif text-3xl md:text-5xl tracking-tight text-center">Momen Kita</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mt-16">
            {BIO.galleryCaptions.map((cap, i) => (
              <div key={cap} className={`reveal polaroid ${i % 2 ? 'md:translate-y-6' : ''}`}>
                <div className="photo">
                  {PHOTOS.gallery[['one', 'two', 'three', 'four', 'five', 'six'][i] as keyof typeof PHOTOS.gallery] ? (
                    <img
                      src={PHOTOS.gallery[['one', 'two', 'three', 'four', 'five', 'six'][i] as keyof typeof PHOTOS.gallery]!}
                      alt={cap}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-cream/25 text-xs">Foto {i + 1}</span>
                    </div>
                  )}
                </div>
                <div className="caption">{cap}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ GAME: Petualangan Peri ============ */}
      <section id="game" className="bg-ink py-24 md:py-32 relative text-center">
        <div className="max-w-3xl mx-auto px-6">
          <div className="reveal text-gold text-[10px] uppercase tracking-[0.3em] mb-4">✦ Mini Game</div>
          <h2 className="reveal font-serif text-3xl md:text-5xl tracking-tight">
            Petualangan Peri di Hutan Ajaib
          </h2>
          <p className="reveal mt-4 text-cream/65 leading-relaxed max-w-xl mx-auto">
            Bantu peri kecil mengumpulkan stardust, hindari kelelawar dan tanaman berduri, dan temukan gerbang ke hutan ajaib.
          </p>
          <FairyGame />
        </div>
      </section>

      {/* ============ 5. EPILOGUE (video background) ============ */}
      <section id="epilogue" className="relative bg-ink py-24 md:py-36 overflow-hidden">
        {/* background video */}
        <video
          className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
          src="/videos/epilogue-bg.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        {/* overlay gelap utk keterbacaan */}
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/60 to-ink pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <div className="reveal glass p-10 md:p-16 text-center">
            <div className="text-gold text-[10px] uppercase tracking-[0.3em] mb-6">Epilogue</div>
            <blockquote className="font-serif text-xl md:text-3xl leading-relaxed text-cream/90 italic">
              &ldquo;{BIO.epilogue}&rdquo;
            </blockquote>
            <div className="mt-8 text-xs uppercase tracking-[0.25em] text-gold">For Nia</div>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-cream/10 py-8 text-center text-cream/40 text-xs tracking-[0.2em]">
        {BIO.footer}
      </footer>
    </main>
  );
}

export default App;