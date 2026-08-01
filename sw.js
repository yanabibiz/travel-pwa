const CACHE_NAME = 'travel-blog-v1'
const OFFLINE_URL = '/travel-pwa/offline.html'

const PRECACHE_URLS = [
	'/travel-pwa/',
	'/travel-pwa/index.html',
	'/travel-pwa/destinations.html',
	'/travel-pwa/tips.html',
	'/travel-pwa/contacts.html',
	'/travel-pwa/styles.css',
	'/travel-pwa/app.js',
	'/travel-pwa/manifest.json',
	'/travel-pwa/offline.html',
	'/travel-pwa/icons/icon-192.png',
	'/travel-pwa/icons/icon-512.png',
	'/travel-pwa/images/italy.jpg',
	'/travel-pwa/images/japan.jpg',
	'/travel-pwa/images/iceland.jpg',
]

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(PRECACHE_URLS))
			.then(() => self.skipWaiting()),
	)
})

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((key) => key !== CACHE_NAME)
						.map((key) => caches.delete(key)),
				),
			)
			.then(() => self.clients.claim()),
	)
})

self.addEventListener('fetch', (event) => {
	const request = event.request
	const url = new URL(request.url)

	if (url.origin !== location.origin) return

	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request)
				.then((response) => {
					const copy = response.clone()
					caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
					return response
				})
				.catch(() =>
					caches
						.match(request)
						.then((cached) => cached || caches.match(OFFLINE_URL)),
				),
		)
	} else {
		event.respondWith(
			caches.match(request).then((cached) => {
				if (cached) return cached
				return fetch(request).then((response) => {
					const copy = response.clone()
					caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
					return response
				})
			}),
		)
	}
})

self.addEventListener('push', (event) => {
	const data = event.data?.json() || {}
	const title = data.title || 'Новое уведомление'
	const options = {
		body: data.body || 'Откройте приложение для подробностей',
		icon: '/travel-pwa/icons/icon-192.png',
		badge: '/travel-pwa/icons/icon-192.png',
		data: { url: data.url || '/travel-pwa/' },
	}
	event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
	event.notification.close()
	const url = event.notification.data?.url || '/travel-pwa/'
	event.waitUntil(
		clients.matchAll({ type: 'window' }).then((windowClients) => {
			for (const client of windowClients) {
				if (client.url === url && 'focus' in client) return client.focus()
			}
			if (clients.openWindow) return clients.openWindow(url)
		}),
	)
})
