import type { RetryPolicy } from '../utils/toRetryPolicy';

/**
 * The retry backoff: one pending retry at a time, after a delay that doubles
 * up to `maxDelay` each time one is scheduled. Without a policy (reconnect
 * turned off) nothing is ever scheduled.
 */
export class RetryScheduler {
	private policy: RetryPolicy | null;
	private onRetry: () => void;
	private timer: ReturnType<typeof setTimeout> | null = null;
	private delay: number;

	constructor(policy: RetryPolicy | null, onRetry: () => void) {
		this.policy = policy;
		this.onRetry = onRetry;
		this.delay = policy?.initialDelay ?? 0;
	}

	get isPending(): boolean {
		return this.timer !== null;
	}

	/** Schedules a retry unless one is already pending. */
	schedule(): void {
		if (!this.policy || this.timer) {
			return;
		}
		this.timer = setTimeout(() => {
			this.timer = null;
			this.onRetry();
		}, this.delay);
		this.delay = Math.min(this.delay * 2, this.policy.maxDelay);
	}

	/** Runs a retry right away, with the backoff started over. */
	runNow(): void {
		this.cancel();
		this.restart();
		this.onRetry();
	}

	cancel(): void {
		if (this.timer) {
			clearTimeout(this.timer);
		}
		this.timer = null;
	}

	/** Starts the backoff over: the next retry waits `initialDelay` again. */
	restart(): void {
		this.delay = this.policy?.initialDelay ?? 0;
	}
}
