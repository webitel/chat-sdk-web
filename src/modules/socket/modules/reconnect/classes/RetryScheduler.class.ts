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

	/** A pending retry means the client still wants the socket. */
	get isPending(): boolean {
		return this.timer !== null;
	}

	/** One retry per drop: a drop reports both `error` and `disconnected`. */
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

	/** Runs the pending retry right away, optionally with the backoff started over. */
	runNow({ restart }: { restart: boolean }): void {
		this.cancel();
		if (restart) {
			this.restart();
		}
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
