const CACHE_NAME = 'master-dice-v1';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './main.js',
    './translations.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './sounds/coin.mp3',
    './sounds/dice.mp3',
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});