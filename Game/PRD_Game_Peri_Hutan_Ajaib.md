# PRD — Web Game Petualangan: Peri di Hutan Ajaib

| | |
|---|---|
| **Working Title** | *Enchanted Fairy Quest* (nama final TBD) |
| **Versi Dokumen** | 1.0 |
| **Tanggal** | 31 Agustus 2026 |
| **Status** | Draft |
| **Platform** | Web (browser, desktop-first) |
| **Genre** | 2D Side-scroller Platformer / Action-Adventure |

---

## 1. Ringkasan Produk

Sebuah landing page yang memperkenalkan sebuah dunia hutan ajaib, dengan tombol "Mulai Petualangan" yang membawa pengunjung langsung masuk ke game platformer 2D berbasis browser (tanpa instalasi). Pemain mengendalikan karakter peri kecil yang menjelajahi hutan ajaib, melompat antar platform, mengumpulkan stardust/orb, dan menghadapi musuh khas hutan magis — terinspirasi gameplay *Super Mario* (platforming) dan *Contra* (aksi tembak-menembak ringan), dibungkus tema visual yang lembut dan bercahaya (bukan tema militer/gore seperti Contra asli).

## 2. Latar Belakang & Peluang

- Game browser (HTML5) mudah dibagikan lewat satu link, tanpa install, cocok untuk portofolio, promosi brand, atau produk hiburan ringan.
- Genre platformer 2D klasik punya nostalgia kuat dan mekanik yang sudah teruji, sehingga risiko desain game lebih rendah dibanding genre baru.
- Tema "peri & hutan ajaib" membuka ruang untuk visual yang playful dan ramah semua umur, berbeda dari platformer bertema aksi/militer.

## 3. Tujuan Produk (Goals)

1. **Landing page yang mengonversi**: pengunjung memahami konsep game dalam <10 detik dan terdorong menekan CTA "Main Sekarang".
2. **Gameplay inti yang solid**: kontrol responsif (jump, flutter, dash, tembakan sihir) dengan feel yang smooth di 60 FPS.
3. **MVP yang bisa dimainkan end-to-end**: minimal 3 level dengan progresi kesulitan, bisa diselesaikan dari awal sampai akhir tanpa bug blocking.
4. **Ringan & cepat diakses**: waktu loading awal landing page tetap cepat meski game itu sendiri berat, dengan strategi *lazy-load*.

## 4. Target Pengguna

| Persona | Deskripsi | Kebutuhan Utama |
|---|---|---|
| Casual browser gamer | Main sebentar di sela waktu luang, tanpa install apa pun | Loading cepat, kontrol sederhana |
| Penggemar platformer nostalgia | Familiar dengan Mario/Contra, cari game ringan bertema baru | Mekanik solid, level dengan tantangan bertahap |
| Anak-anak & keluarga | Tertarik visual peri yang lucu dan colorful | Konten aman (tanpa darah/gore), kesulitan tidak frustrasi |

## 5. Ruang Lingkup

**In-scope (v1 / MVP):**
- Landing page single-page dengan CTA masuk ke game
- Game core: movement, kombat sihir dasar, 3–5 level hutan ajaib, sistem nyawa & checkpoint
- Menu utama, pause menu, layar game over/level complete

**Out-of-scope (v1, kandidat v2):**
- Multiplayer / co-op
- Leaderboard online & akun pemain (butuh backend)
- Versi mobile native (Android/iOS)
- In-app purchase / monetisasi
- Level editor untuk pemain

## 6. Alur Pengguna (User Flow)

```
Landing Page → [Klik "Mulai Petualangan"] → Loading Screen (lazy-load asset game)
   → Menu Utama (Start / Pilih Level / Pengaturan)
   → Gameplay (Level 1 → 2 → 3 → ...)
   → Level Complete → lanjut level berikutnya
   → (jika nyawa habis) Game Over → Retry / Kembali ke Menu
```

## 7. Spesifikasi Landing Page

- **Hero section**: judul game, tagline singkat, ilustrasi/animasi peri di hutan bercahaya, tombol CTA utama "Mulai Petualangan".
- **Section fitur**: 3–4 highlight singkat (mis. "Melayang & Dash", "Tembakan Sihir", "Hutan Penuh Misteri") masing-masing dengan ikon/ilustrasi kecil.
- **Preview gameplay**: screenshot atau GIF singkat dari gameplay asli.
- **Cara bermain**: ringkasan kontrol (keyboard: panah/WASD, spasi lompat, X tembak, dsb).
- **Footer**: kredit aset (jika pakai aset pihak ketiga wajib dicantumkan sesuai lisensi), link sosial/kontak.
- **Performa**: bundle game (Phaser + assets) di-*lazy load* hanya saat CTA diklik, supaya landing page sendiri ringan dan cepat tampil.
- **Responsif**: landing page harus tampil baik di mobile & desktop, meskipun gameplay-nya sendiri desktop-first (keyboard).

## 8. Konsep Desain & Mekanik Game

### 8.1 Tema Visual
- **Enchanted Forest**: nuansa warna neon/pastel, partikel sihir (magic sparkle), pohon jamur menyala (glow mushroom), kunang-kunang, kabut tipis sebagai elemen atmosfer/parallax.
- Palet warna hangat-dingin kontras (ungu-hijau tosca-pink neon) agar karakter dan musuh tetap kontras terhadap background agar terbaca (readability) saat gameplay cepat.
- **Catatan hak cipta**: karakter peri sebaiknya didesain *original* dengan gaya terinspirasi arketipe "peri kecil bersayap bercahaya" (seperti yang dimaksud pengguna), bukan mereplikasi desain karakter berhak cipta (mis. Tinker Bell milik Disney), untuk menghindari masalah lisensi/IP saat rilis publik.

### 8.2 Karakter Utama: Peri
| Aspek | Detail |
|---|---|
| Movement dasar | Jalan kiri/kanan, double jump |
| Movement khas | *Flutter/hover* — sayap mengepak, melayang turun perlahan selama beberapa detik (menggantikan jump konvensional Mario) |
| Movement lanjutan | *Dash* dengan jejak cahaya (glitter trail), berguna untuk menghindar/melewati jurang |
| Attack/Interaksi | Tembakan sihir (magic projectile, mirip Contra/Megaman) sebagai serangan jarak jauh |
| Collectible | Stardust/orb — dikumpulkan untuk membuka gerbang/portal menuju level berikutnya |
| Nyawa | Sistem heart/nyawa terbatas, checkpoint di titik tertentu tiap level |
| Power-up (opsional MVP+) | Speed boost, shield sementara, extra jump |

### 8.3 Struktur Level
- Tiap level = satu area hutan dengan tema variasi (mis. Level 1: Hutan Pembuka/tutorial, Level 2: Rawa Kabut, Level 3: Puncak Pohon Raksasa).
- Level diakhiri gerbang sihir yang butuh sejumlah stardust untuk dibuka → mendorong eksplorasi, bukan cuma lari ke ujung level.
- Checkpoint tengah level agar pemain tidak mengulang dari awal saat mati.

### 8.4 Musuh & Rintangan
| Musuh/Rintangan | Perilaku | Cara Dikalahkan/Dilewati |
|---|---|---|
| Tanaman berduri beracun | Statis, menyerang saat didekati | Hindari atau tembak dari jauh |
| Kelelawar malam | Terbang pola zig-zag | Tembak atau dash melewati |
| Laba-laba raksasa | Musuh mini-boss, menjatuhkan jaring dari atas | Butuh beberapa hit, pola serangan sederhana |

### 8.5 Platform & Elemen Interaktif
| Elemen | Fungsi |
|---|---|
| Daun raksasa yang membal (bouncy leaf) | Melontarkan pemain lebih tinggi, mirip trampolin |
| Dahan pohon rapuh | Runtuh beberapa detik setelah diinjak, mendorong pemain bergerak cepat |
| Awan melayang | Platform bergerak (moving platform) horizontal/vertikal |

### 8.6 UI/HUD
- Indikator nyawa (heart icon)
- Counter stardust/orb
- (Opsional) indikator cooldown tembakan sihir
- Pause menu: resume, restart level, kembali ke menu utama, pengaturan volume

## 9. Rekomendasi Tech Stack

| Layer | Rekomendasi | Alasan |
|---|---|---|
| Game engine | **Phaser 3** | Framework 2D HTML5 paling matang; arcade physics (gravitasi, collision), tilemap support, sistem partikel (untuk sparkle trail), audio manager bawaan |
| Alternatif engine | Kaboom.js (lebih ringkas untuk prototipe cepat) / PixiJS (jika perlu custom engine) | Cadangan bila butuh pengembangan lebih cepat atau kontrol rendering lebih rendah-level |
| Level design | **Tiled Map Editor** | Software gratis untuk menyusun tilemap (tanah, pohon, rintangan, spawn point) → export `.json` yang langsung dibaca Phaser |
| Landing page | HTML/CSS/JS statis (atau React/Vite bila ingin komponen reusable) | Ringan, mudah embed `<div>` container untuk memuat game Phaser |
| Build tool | Vite atau Webpack | Bundling & lazy-loading modul game secara efisien |
| Hosting | Static hosting (Vercel/Netlify/GitHub Pages, dsb.) | Game HTML5 statis tidak butuh server backend untuk MVP |
| Backend (opsional, v2) | Node.js + database ringan | Hanya diperlukan bila menambah leaderboard/akun pemain di masa depan |

### Arsitektur Teknis (High-Level)
- Landing page memuat `<div id="game-container">` yang awalnya kosong; bundle Phaser baru di-*fetch* saat tombol CTA diklik (code-splitting/lazy import).
- Struktur scene Phaser yang disarankan: `BootScene` → `PreloadScene` (loading bar) → `MenuScene` → `LevelScene` (per level) → `UIScene` (HUD, berjalan paralel) → `GameOverScene` / `LevelCompleteScene`.
- Data level (posisi musuh, platform, spawn point) disimpan sebagai file JSON hasil export Tiled, dimuat dinamis per level agar mudah menambah level baru tanpa mengubah kode inti.

## 10. Sumber Aset Visual & Audio

| Kebutuhan | Sumber | Catatan |
|---|---|---|
| Sprite karakter peri & musuh | itch.io (kata kunci: `fairy sprite 2d`, `enchanted forest pixel art`) | Cek lisensi tiap aset (free untuk komersial vs. hanya personal) |
| Tileset hutan ajaib | itch.io (`magic forest tileset`), CraftPix.net, OpenGameArt.org | CraftPix biasanya berbayar ringan untuk kualitas lebih tinggi; OpenGameArt banyak yang CC0/gratis |
| Efek partikel (sparkle, glow) | Bisa digambar manual atau pakai particle emitter bawaan Phaser dengan sprite kecil sederhana | Efisien secara performa dibanding sprite animasi berat |
| Audio (musik & SFX) | freesound.org, OpenGameArt.org, Kenney.nl (aset & audio gratis CC0) | Kenney.nl sangat direkomendasikan untuk SFX game ringan berlisensi bebas |
| **Penting** | Selalu cek & catat lisensi tiap aset (CC0, CC-BY, royalty-free komersial, dsb.) sebelum dipakai, dan cantumkan kredit di footer landing page bila lisensi mewajibkannya | Menghindari masalah hukum saat game dipublikasikan |

## 11. Requirement Non-Fungsional

- **Performa**: target 60 FPS di desktop modern; batasi ukuran total aset awal (mis. <10–15MB) agar loading tidak terlalu lama.
- **Kompatibilitas browser**: Chrome, Firefox, Edge, Safari versi terbaru.
- **Kontrol**: keyboard (panah/WASD + tombol aksi) sebagai kontrol utama MVP; kontrol sentuh/virtual joystick untuk mobile masuk sebagai kandidat v2.
- **Aksesibilitas**: opsi remap tombol dan pengaturan volume musik/SFX terpisah.
- **Rating konten**: aman untuk semua umur — tanpa darah/gore, desain musuh "menggemaskan-menantang" bukan menyeramkan.

## 12. Roadmap & Milestone

| Fase | Cakupan | Estimasi |
|---|---|---|
| 1. Pra-produksi | Finalisasi konsep, pemilihan/pembelian aset, setup project Phaser + build tool | 1 minggu |
| 2. Prototipe Core Mechanic | Movement (jump, flutter, dash), tembakan sihir, collision dasar, 1 level uji | 1–2 minggu |
| 3. Level Design MVP | 3–5 level lengkap dengan musuh, platform, checkpoint, gerbang stardust | 2–3 minggu |
| 4. Integrasi Landing Page | Landing page + lazy-load game, CTA, preview gameplay | 1 minggu |
| 5. Polish & QA | Balancing kesulitan, bugfix, optimasi performa & loading | 1–2 minggu |
| 6. Launch | Deploy ke hosting statis, monitoring awal | — |

## 13. Metrik Keberhasilan (KPI)

- **Click-through rate** landing page → game (persentase pengunjung yang menekan CTA)
- **Completion rate** per level (berapa persen pemain yang menyelesaikan tiap level)
- **Rata-rata durasi sesi bermain**
- **Bounce rate** pada loading screen (indikasi apakah loading terlalu lama)

## 14. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Desain karakter terlalu mirip IP berhak cipta (mis. Tinker Bell) | Masalah hukum/hak cipta saat publikasi | Desain peri original, gunakan referensi hanya sebagai inspirasi gaya, bukan acuan visual langsung |
| Aset pihak ketiga berlisensi tidak jelas | Pelanggaran lisensi | Selalu verifikasi & dokumentasikan lisensi tiap aset sebelum dipakai |
| Ukuran aset terlalu besar → loading lambat | Bounce rate tinggi di landing page | Sprite atlas, kompresi gambar, lazy-load bundle game |
| Scope terlalu luas untuk MVP | Timeline molor | Batasi MVP ketat ke 3–5 level, fitur v2 (multiplayer, mobile, leaderboard) ditunda |

## 15. Pertanyaan Terbuka / Next Steps

- Nama final game & identitas brand (logo, tagline)?
- Apakah butuh backend untuk simpan progres pemain (save game), atau cukup progres per sesi browser (localStorage)?
- Target device utama untuk v1: desktop saja, atau mobile-responsive juga jadi prioritas?
- Berapa jumlah level yang realistis untuk MVP dengan sumber daya/waktu yang ada?
