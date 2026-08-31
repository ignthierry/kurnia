# Kurnia — Deployment Report

**Project:** Interactive character-study web page with video scrubbing  
**Stack:** React 19 + Vite 8 + TypeScript 6 + Tailwind CSS 4  
**Deployed:** 2026-08-13 11:03 WIB  

## ✅ Status: RUNNING

**Dev Server:** http://localhost:3003 (also http://192.168.1.103:3003)  
**Process ID:** 248736  
**Video:** 10.25 seconds, 10.27 MB  

---

## 🎯 Features Verified

✅ **Fullscreen video background** — cinematic dark gradient overlay  
✅ **Mouse-controlled scrubbing** — horizontal X position controls video timeline  
✅ **Smooth easing** — requestAnimationFrame with 0.08 lerp factor  
✅ **Responsive layout** — desktop & mobile adaptive  
✅ **Typography** — Large "Kurnia" title, character study labels  

### Interactive Test Results:
- Mouse LEFT (X=100) → video seeks to ~1s (early frame)  
- Mouse RIGHT (X=1180) → video seeks to ~6s (later frame)  
- Easing smooth, no jank (~800ms settle time)

---

## 📁 Structure

```
/root/projects/kurnia/
├── src/
│   ├── App.tsx          # Main interactive component
│   ├── main.tsx
│   ├── index.css
│   └── assets/
│       ├── hero.png
│       └── react.svg
├── public/
│   ├── bg-video.mp4     # 10.27 MB background video
│   ├── icons.svg
│   └── favicon.svg
├── dist/                # Production build (907ms)
│   ├── index.html
│   └── assets/
└── package.json
```

---

## 🚀 Commands

```bash
cd /root/projects/kurnia

# Development (currently running on :3003)
npm run dev -- --port 3003 --host 0.0.0.0

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

---

## 🎨 Design Details

**Colors:**  
- Background: Black with radial gradients  
- Text: White with subtle opacity variations  
- Overlay: from-black/90 via-black/20 to-black/10

**Typography:**  
- Title: 6xl → 9xl → 12rem responsive  
- Labels: 10px → xs uppercase tracking-widest  
- Caption: sm → base bold uppercase

**Layout:**  
- Top left: "Character Study"  
- Top right: "Interactive Web / Motion Narrative"  
- Bottom left: "Kurnia" (main title)  
- Bottom right: "The cutest being on a planet" (caption)

---

## 🔧 Technical Notes

- Video preloaded with `preload="auto"`
- Paused during scrubbing (no autoplay)
- Uses `pointermove` event (touch + mouse)
- Video `currentTime` updated via RAF loop
- Easing prevents thrashing (0.01s threshold)
- Initial position: middle of video (5s)

---

## 📊 Performance

- Build time: 907ms  
- Bundle size: 193.17 KB JS (gzip: 60.92 KB)  
- CSS: 15.22 KB (gzip: 3.57 KB)  
- Total dev startup: ~434ms  

---

## 🌐 Access URLs

- **Local:** http://localhost:3003  
- **LAN:** http://192.168.1.103:3003  
- **Tailscale:** http://100.91.206.4:3003  

---

**Status:** ✅ Ready for demo / production deployment
