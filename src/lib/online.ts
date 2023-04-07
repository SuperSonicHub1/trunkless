// https://svelte.dev/docs#run-time-svelte-store-readable

import { readable } from "svelte/store"

export default readable(navigator.onLine, set => {
	const updateOnline = () => set(navigator.onLine)
	window.addEventListener('online', updateOnline)
	window.addEventListener('offline', updateOnline)

	return () => {
		window.removeEventListener('online', updateOnline)
		window.removeEventListener('offline', updateOnline)
	}
})
