/** A subscriber's bug is reported, never allowed to stop the client or other subscribers. */
export function notifySafely(notify: () => void): void {
	try {
		notify();
	} catch (err) {
		console.error('[@webitel/chat-web-sdk] a socket subscriber threw', err);
	}
}
