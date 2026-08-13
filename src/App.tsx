import { useEffect, useRef, useState } from 'react';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const targetTimeRef = useRef(0);
  const currentTimeRef = useRef(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      // Map X directly: Left side = start (0), Right side = end (1)
      const progress = (e.clientX / window.innerWidth);
      if (videoRef.current && !isNaN(videoRef.current.duration)) {
        targetTimeRef.current = progress * videoRef.current.duration;
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const loop = () => {
      if (videoRef.current && isLoaded) {
        const video = videoRef.current;
        const target = targetTimeRef.current;
        let current = currentTimeRef.current;

        // Easing function
        current += (target - current) * 0.08;
        currentTimeRef.current = current;

        // Only update if difference is significant to avoid thrashing
        if (Math.abs(video.currentTime - current) > 0.01) {
          video.currentTime = current;
        }
      }
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isLoaded]);

  const handleLoadedMetadata = () => {
    setIsLoaded(true);
    // Initialize target time based on center of screen if desired, 
    // but initially it's 0 (end of video, but progress 0 means start of video... wait.
    // progress = 1 - (X/W). Initially we can just set it to 0 or leave it.)
    if (videoRef.current) {
      targetTimeRef.current = videoRef.current.duration / 2; // Start from middle optionally
      currentTimeRef.current = videoRef.current.duration / 2;
      videoRef.current.currentTime = currentTimeRef.current;
    }
  };

  return (
    <div className="relative w-full h-[100svh] overflow-hidden bg-black text-white selection:bg-white/30">
      {/* Background Video */}
      <video
        ref={videoRef}
        src="/bg-video.mp4"
        preload="auto"
        muted
        playsInline
        onLoadedMetadata={handleLoadedMetadata}
        aria-label="Kurnia - Interactive character story"
        className="absolute inset-0 w-full h-full object-cover scale-105 pointer-events-none opacity-80"
        style={{ transformOrigin: 'center center' }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent pointer-events-none" />

      {/* Content UI */}
      <div className="relative z-10 flex flex-col justify-between w-full h-full p-6 md:p-12 pointer-events-none">
        
        {/* Top Header */}
        <header className="flex justify-between items-start w-full uppercase tracking-widest text-[10px] md:text-xs font-semibold">
          <div className="animate-float-slow">
            <div className="text-white/80 animate-nature-reveal opacity-0 delay-100">Character Study</div>
          </div>
          <div className="animate-float-slow">
            <div className="text-white/80 text-right max-w-[150px] md:max-w-none leading-relaxed animate-nature-reveal opacity-0 delay-300">
              Interactive Web <br className="md:hidden" />
              <span className="hidden md:inline"> / </span>
              Motion Narrative
            </div>
          </div>
        </header>

        {/* Bottom Content */}
        <footer className="flex flex-col md:flex-row justify-between md:items-end gap-4 w-full">
          {/* Main Title */}
          <div className="animate-float-slow">
            <h1 className="text-6xl md:text-9xl lg:text-[12rem] font-bold tracking-tighter leading-none -ml-1 md:-ml-2 text-white drop-shadow-2xl animate-nature-reveal opacity-0 delay-500">
              Kurnia
            </h1>
          </div>
          
          {/* Supporting Caption */}
          <div className="animate-sway-slow">
            <p className="text-sm md:text-base font-bold tracking-wide uppercase text-white/90 pb-2 md:pb-6 max-w-xs animate-nature-reveal opacity-0 delay-700">
              The cutest being on a planet
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
