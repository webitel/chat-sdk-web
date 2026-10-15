/**
 * Listens to the browser's `offline` / `online` events between `start()` and
 * `stop()`. Does nothing without `window.addEventListener` (Node, SSR, workers,
 * React Native).
 */
export class BrowserNetworkWatcher {
	private onOffline: () => void;
	private onOnline: () => void;
	private watching = false;

	constructor({
		onOffline,
		onOnline,
	}: {
		onOffline: () => void;
		onOnline: () => void;
	}) {
		this.onOffline = onOffline;
		this.onOnline = onOnline;
	}

	start(): void {
		// `typeof` guards only a bare identifier: `window?.x` throws where window
		// is not declared at all (Node, SSR)
		if (
			this.watching ||
			typeof window === 'undefined' ||
			typeof window.addEventListener !== 'function'
		) {
			return;
		}
		window.addEventListener('offline', this.onOffline);
		window.addEventListener('online', this.onOnline);
		this.watching = true;
	}

	stop(): void {
		if (!this.watching) {
			return;
		}
		window.removeEventListener('offline', this.onOffline);
		window.removeEventListener('online', this.onOnline);
		this.watching = false;
	}
}
