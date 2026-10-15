export const DEFAULT_CONNECT_TIMEOUT = 10_000;

/**
 * `0` and `Infinity` turn the timeout off; other unusable values (NaN,
 * negative) fall back to the default.
 */
export function toConnectTimeout(connectTimeout: number): number | null {
	if (connectTimeout === 0 || connectTimeout === Number.POSITIVE_INFINITY) {
		return null;
	}
	if (!Number.isFinite(connectTimeout) || connectTimeout < 0) {
		return DEFAULT_CONNECT_TIMEOUT;
	}
	return connectTimeout;
}
