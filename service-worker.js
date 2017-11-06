const config = {
	version: '0.1.0',
	caches: [
		// Main assets
		'/',
		'/js/index.min.js',
		'/css/styles/index.min.css',
		'/img/icons.svg',
		'/img/favicon.svg',

		// Nav menu icons
		'/img/adwaita-icons/actions/document-open-recent.svg',
		'/img/adwaita-icons/actions/go-top.svg',
		'/img/adwaita-icons/actions/view-pin.svg',
		'/img/adwaita-icons/places/folder-publicshare.svg',

		// Logos
		'/img/logos/Facebook.svg',
		'/img/logos/twitter.svg',
		'/img/logos/linkedin.svg',
		'/img/logos/Google_plus.svg',
		'/img/logos/Reddit.svg',

		// Images
		'/img/background.jpg',

		// Fonts
		'/fonts/acme.woff',
		'/fonts/Alice.woff',
		'/fonts/roboto.woff',
		'/fonts/ubuntu.woff2',

		// External Resources
		'https://cdn.polyfill.io/v2/polyfill.min.js',
	],
	ignored: [
		'/service-worker.js',
		'/manifest.json',
	],
	paths: [
		'/js/',
		'/css/',
		'/img/',
		'/fonts/',
		'/posts/',
	],
};

addEventListener('install', async () => {
	const cache = await caches.open(config.version);
	const keys = await caches.keys();
	await keys.forEach(async key => {
		if (key !== config.version) {
			await caches.delete(key);
		}
	});
	await cache.addAll(config.caches);
	skipWaiting();

});

addEventListener('activate', event => {
	event.waitUntil(async function() {
		clients.claim();
		const keys = await caches.keys();
		keys.forEach(async key => {
			if (key !== config.version) {
				await caches.delete(key);
			}
		});
	}());
});

addEventListener('fetch', async event => {
	function isValid(req) {
		try {
			const url = new URL(req.url);
			const isGet = req.method === 'GET';
			const sameOrigin = url.origin === location.origin;
			const isHome = ['/', '/index.html', '/index.php'].some(path => url.pathname === path);
			const notIgnored = config.ignored.every(path => url.pathname !== path);
			const allowedPath = config.paths.some(path => url.pathname.startsWith(path));

			return isGet && sameOrigin && (isHome || (allowedPath && notIgnored));
		} catch(err) {
			console.error(err);
			return false;
		}
	}

	async function get(request) {
		const cache = await caches.open(config.version);
		const cached = await cache.match(request);

		if (navigator.onLine) {
			const fetched = fetch(request).then(async resp => {
				if (resp instanceof Response) {
					const respClone = await resp.clone();
					await cache.put(event.request, respClone);
				}
				return resp;
			});

			if (cached instanceof Response) {
				return cached;
			} else {
				const resp = await fetched;
				return resp;
			}
		} else {
			return cached;
		}
	}

	if (isValid(event.request)) {
		event.respondWith(get(event.request));
	}
});
