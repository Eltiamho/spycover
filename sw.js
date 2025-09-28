// Nama cache (gudang penyimpanan)
const CACHE_NAME = 'undercover-spyfall-game-v1';

// Daftar semua file dengan PATH YANG SUDAH DIPERBAIKI
const urlsToCache = [
  './',
  './index.html',
  './reveal.html',
  './elimination.html',
  './finish.html',
  './style.css',
  './script.js',
  './icon-192x192.png',
  './icon-512x512.png',
  './manifest.json'
];

// Event 'install': Dijalankan saat service worker diinstal
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache dibuka, mencoba menyimpan file...');
        return cache.addAll(urlsToCache); // Menyimpan semua file ke cache
      })
      .catch(err => {
        console.error('Gagal menyimpan cache:', err); // Menambah log error
      })
  );
});

// Event 'fetch': Dijalankan setiap kali ada permintaan (misal: membuka halaman)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Jika file ditemukan di cache, langsung berikan dari cache
        if (response) {
          return response;
        }
        // Jika tidak, ambil dari internet
        return fetch(event.request);
      })
  );
});