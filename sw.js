const CACHE_NAME = 'travel-blog-v1'
const OFFLINE_URL = '/offline.html'

const PRECACHE_URLS = [
	'/',
	'/index.html',
	'/destinations.html',
	'/tips.html',
	'/contacts.html',
	'/styles.css',
	'/app.js',
	'/manifest.json',
	'/offline.html',
	'/icons/icon-192.png',
	'/icons/icon-512.png',
	'/images/italy.jpg',
	'/images/japan.jpg',
	'/images/iceland.jpg',
	'/images/thailand.jpg',
	'/icons/apple-touch-icon.png',
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
		icon: '/icons/icon-192.png',
		badge: '/icons/icon-192.png',
		data: { url: data.url || '/' },
	}
	event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
	event.notification.close()
	const url = event.notification.data?.url || '/'
	event.waitUntil(
		clients.matchAll({ type: 'window' }).then((windowClients) => {
			for (const client of windowClients) {
				if (client.url === url && 'focus' in client) return client.focus()
			}
			if (clients.openWindow) return clients.openWindow(url)
		}),
	)
})
