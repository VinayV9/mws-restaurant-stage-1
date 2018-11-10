const CACHE_NAME = 'my-site-cache-v7';
const urlsToCache = [
    '/',
    '/index.html',
    '/restaurant.html',
    '/restaurant.html?id=*',
    '/css/styles.css',
    '/js/dbhelper.js',
    '/js/main.js',
    '/js/restaurant_info.js',
    '/js/swRegister.js',
    '/icons/icon-72x72.png',
    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
    'https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon.png',
    'https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon-2x.png'
];

self.addEventListener('install', function (event) {
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});


self.addEventListener('activate', (event) => {
    
    //Remove unwanted caches
    caches.keys().then(cacheNames => {
        return Promise.all(
            cacheNames.map(cache => {
                if (cache !== CACHE_NAME) {
                    return caches.delete(cache);
                }
            })
        )
    })
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request)
            .then(function (response) {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request).then(function(res){
                    let cloneRes = res.clone();
                    caches.open(CACHE_NAME).then(function(cache){
                        cache.put(event.request, cloneRes);
                    });
                    return res;
                });
            })  
    );
});
