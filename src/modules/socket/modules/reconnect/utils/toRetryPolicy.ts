const DEFAULT_INITIAL_RETRY_DELAY = 1_000;
const DEFAULT_MAX_RETRY_DELAY = 30_000;

export type RetryPolicy = {
	initialDelay: number;
	maxDelay: number;
};

const positiveOr = (value: number | undefined, fallback: number): number =>
	value !== undefined && Number.isFinite(value) && value > 0 ? value : fallback;

/**
 * A delay that is not a positive number (0, negative, NaN, Infinity) falls
 * back to its default: a zero delay would never grow, retrying a failing
 * server in a hot loop.
 */
export function toRetryPolicy({
	initialDelay,
	maxDelay,
}: {
	initialDelay?: number;
	maxDelay?: number;
}): RetryPolicy {
	return {
		initialDelay: positiveOr(initialDelay, DEFAULT_INITIAL_RETRY_DELAY),
		maxDelay: positiveOr(maxDelay, DEFAULT_MAX_RETRY_DELAY),
	};
}
