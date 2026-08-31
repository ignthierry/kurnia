# Kurnia — Static Deployment (Production)

**Deployed:** 2026-08-13 11:22 WIB  
**Domain:** nia.luvion.my.id  
**Method:** Static files via nginx (seperti short.luvion.my.id)  

---

## ✅ Status: READY FOR DNS UPDATE

**Server:** LXC 103 (192.168.1.103)  
**Web Root:** `/var/www/kurnia/`  
**Total Size:** 11 MB (10.27 MB video + 208 KB code)  
**Nginx Config:** `/etc/nginx/sites-available/nia`  

---

## 🌐 DNS Setup Required

Update di Cloudflare Dashboard untuk domain **nia.luvion.my.id**:

```
Type: A
Name: nia
Content: 192.168.1.103
Proxy: DNS only (grey cloud ☁️, BUKAN orange 🟠)
TTL: Auto
```

**Langkah-langkah:**
1. Login ke Cloudflare Dashboard
2. Pilih domain `luvion.my.id`
3. Menu DNS → Records
4. Cari record `nia` (atau tambah baru kalau belum ada)
5. Edit/Create:
   - Type: **A**
   - Name: **nia**
   - IPv4 address: **192.168.1.103**
   - Proxy status: **DNS only** (klik ikon cloud sampai jadi grey)
6. Save

**Verifikasi DNS propagasi:**
```bash
dig +short nia.luvion.my.id
# Harus return: 192.168.1.103
```

---

## 📁 Files Deployed

```
/var/www/kurnia/
├── index.html          458 B
├── bg-video.mp4        10.27 MB
├── favicon.svg         9.5 KB
├── icons.svg           5 KB
└── assets/
    ├── index-CzpOPC_k.js     193 KB (gzip: 60.92 KB)
    └── index-DLQF_LO_.css     15 KB (gzip: 3.57 KB)
```

---

## 🧪 Test Results (localhost)

✅ HTML: HTTP 200, 458 bytes  
✅ JavaScript: HTTP 200, 193,179 bytes  
✅ CSS: HTTP 200, 15,229 bytes  
✅ Video: HTTP 200, 10,270,966 bytes  

---

## 🚀 Features

- **Interactive video scrubbing** — mouse X position controls video timeline
- **Fullscreen cinematic background** — dark gradient overlay
- **Smooth easing** — requestAnimationFrame with lerp
- **Responsive layout** — mobile & desktop adaptive
- **Static caching** — 7 days cache for assets

---

## 🔧 Nginx Configuration

```nginx
server {
    listen 80;
    server_name nia.luvion.my.id;
    root /var/www/kurnia;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|mp4|woff2?)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 🔄 Update Deployment

Kalau ada perubahan code:

```bash
cd /root/projects/kurnia
npm run build
sudo rm -rf /var/www/kurnia/*
sudo cp -r dist/* /var/www/kurnia/
sudo systemctl reload nginx
```

---

## 📊 Performance

- Build time: 1.89s
- Bundle size: 193 KB JS + 15 KB CSS (gzipped: 60 KB + 3.5 KB)
- Video: 10.27 MB (preloaded)
- First load: ~11 MB total

---

## 🌐 Access After DNS Update

- **Production URL:** https://nia.luvion.my.id
- **LAN URL:** http://192.168.1.103 (dengan Host header)

---

**Status:** ✅ Server ready, waiting for DNS update
