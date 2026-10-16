import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RetryScheduler } from '../classes/RetryScheduler.class';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

const policy = {
	initialDelay: 1_000,
	maxDelay: 4_000,
};

describe('RetryScheduler', () => {
	it('runs a scheduled retry after the initial delay', () => {
		const onRetry = vi.fn();
		const retries = new RetryScheduler(policy, onRetry);

		retries.schedule();
		vi.advanceTimersByTime(999);
		expect(onRetry).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);

		expect(onRetry).toHaveBeenCalledOnce();
		expect(retries.isPending).toBe(false);
	});

	it('doubles the delay up to maxDelay', () => {
		const onRetry = vi.fn();
		const retries = new RetryScheduler(policy, onRetry);

		for (const [index, delay] of [
			1_000,
			2_000,
			4_000,
			4_000,
		].entries()) {
			retries.schedule();
			vi.advanceTimersByTime(delay - 1);
			expect(onRetry).toHaveBeenCalledTimes(index);
			vi.advanceTimersByTime(1);
			expect(onRetry).toHaveBeenCalledTimes(index + 1);
		}
	});

	it('keeps one retry pending at a time', () => {
		const onRetry = vi.fn();
		const retries = new RetryScheduler(policy, onRetry);

		retries.schedule();
		retries.schedule();
		vi.advanceTimersByTime(10_000);

		expect(onRetry).toHaveBeenCalledOnce();
	});

	it('cancels a pending retry', () => {
		const onRetry = vi.fn();
		const retries = new RetryScheduler(policy, onRetry);

		retries.schedule();
		expect(retries.isPending).toBe(true);
		retries.cancel();
		vi.advanceTimersByTime(10_000);

		expect(retries.isPending).toBe(false);
		expect(onRetry).not.toHaveBeenCalled();
	});

	it('starts the delay over after restart()', () => {
		const onRetry = vi.fn();
		const retries = new RetryScheduler(policy, onRetry);
		retries.schedule();
		vi.advanceTimersByTime(1_000);

		retries.restart();
		retries.schedule();
		vi.advanceTimersByTime(1_000);

		expect(onRetry).toHaveBeenCalledTimes(2);
	});

	it('runs the pending retry now, with the delay started over', () => {
		const onRetry = vi.fn();
		const retries = new RetryScheduler(policy, onRetry);
		retries.schedule();
		vi.advanceTimersByTime(1_000);
		retries.schedule();

		retries.runNow();
		expect(onRetry).toHaveBeenCalledTimes(2);
		expect(retries.isPending).toBe(false);

		retries.schedule();
		vi.advanceTimersByTime(1_000);
		expect(onRetry).toHaveBeenCalledTimes(3);
	});

	it('never schedules without a policy', () => {
		const onRetry = vi.fn();
		const retries = new RetryScheduler(null, onRetry);

		retries.schedule();
		vi.advanceTimersByTime(60_000);

		expect(retries.isPending).toBe(false);
		expect(onRetry).not.toHaveBeenCalled();
	});
});
