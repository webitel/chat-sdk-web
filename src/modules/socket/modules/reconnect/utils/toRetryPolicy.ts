import { MAX_TIMER_DELAY } from '../../../utils/maxTimerDelay';

const DEFAULT_INITIAL_RETRY_DELAY = 1_000;
const DEFAULT_MAX_RETRY_DELAY = 30_000;

export type RetryPolicy = {
	initialDelay: number;
	maxDelay: number;
};

/**
 * Unusable delays (NaN, Infinity, `maxDelay` <= 0) fall back to the defaults.
 * The first delay is kept between 1ms and `maxDelay`, so a failing server is
 * never retried in a hot loop.
 */
export function toRetryPolicy({
	initialDelay,
	maxDelay,
}: {
	initialDelay?: number;
	maxDelay?: number;
}): RetryPolicy {
	const usableMaxDelay =
		maxDelay !== undefined && Number.isFinite(maxDelay) && maxDelay > 0
			? Math.min(maxDelay, MAX_TIMER_DELAY)
			: DEFAULT_MAX_RETRY_DELAY;
	const usableInitialDelay =
		initialDelay !== undefined && Number.isFinite(initialDelay)
			? initialDelay
			: DEFAULT_INITIAL_RETRY_DELAY;
	return {
		initialDelay: Math.min(Math.max(usableInitialDelay, 1), usableMaxDelay),
		maxDelay: usableMaxDelay,
	};
}
