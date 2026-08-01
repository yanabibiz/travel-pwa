if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker
			.register('/sw.js')
			.then((registration) => {
				console.log('SW зарегистрирован с областью:', registration.scope)
				checkSubscription(registration)
			})
			.catch((err) => console.error('Ошибка регистрации SW:', err))
	})
}

const VAPID_PUBLIC_KEY =
	'BLlYtP2LtKFhJMHiENP_sUjJkiDWyHeJFG_sBrCh9CuXDkLyDHHaXB2_vV-dO85sa7c-ZpoTetS0fFEqBcfAZYM'

async function checkSubscription(registration) {
	const subscription = await registration.pushManager.getSubscription()
	if (subscription) {
		console.log('Уже подписаны:', subscription)
		updateUI(subscription)
	} else {
		console.log('Нет активной подписки')
	}
}

async function subscribeToPush() {
	const permission = await Notification.requestPermission()
	if (permission !== 'granted') {
		alert('Разрешение не получено. Уведомления не будут работать.')
		return
	}

	const registration = await navigator.serviceWorker.ready
	try {
		const subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
		})
		console.log('Подписка создана:', subscription)
		localStorage.setItem('pushSubscription', JSON.stringify(subscription))
		updateUI(subscription)
		alert('Вы успешно подписались на уведомления!')
	} catch (err) {
		console.error('Ошибка подписки:', err)
		alert('Не удалось подписаться. Проверьте консоль.')
	}
}

function urlBase64ToUint8Array(base64String) {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
	const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
	const rawData = atob(base64)
	const outputArray = new Uint8Array(rawData.length)
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i)
	}
	return outputArray
}

function updateUI(subscription) {
	const btn = document.getElementById('subscribeBtn')
	if (btn) {
		if (subscription) {
			btn.textContent = '✅ Подписка активна'
			btn.disabled = true
		} else {
			btn.textContent = '🔔 Подписаться на уведомления'
			btn.disabled = false
		}
	}
}

window.subscribeToPush = subscribeToPush
