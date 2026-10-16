import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BrowserNetworkWatcher } from '../classes/BrowserNetworkWatcher.class';

let browserWindow: EventTarget;

beforeEach(() => {
	browserWindow = new EventTarget();
	vi.stubGlobal('window', browserWindow);
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

const goOffline = () => browserWindow.dispatchEvent(new Event('offline'));
const goOnline = () => browserWindow.dispatchEvent(new Event('online'));

function createWatcher() {
	const onOffline = vi.fn();
	const onOnline = vi.fn();
	const watcher = new BrowserNetworkWatcher({
		onOffline,
		onOnline,
	});
	return {
		watcher,
		onOffline,
		onOnline,
	};
}

describe('BrowserNetworkWatcher', () => {
	it('reports offline and online once started', () => {
		const { watcher, onOffline, onOnline } = createWatcher();

		watcher.start();
		goOffline();
		goOnline();

		expect(onOffline).toHaveBeenCalledOnce();
		expect(onOnline).toHaveBeenCalledOnce();
	});

	it('reports nothing before start() or after stop()', () => {
		const { watcher, onOffline, onOnline } = createWatcher();

		goOffline();
		watcher.start();
		watcher.stop();
		goOffline();
		goOnline();

		expect(onOffline).not.toHaveBeenCalled();
		expect(onOnline).not.toHaveBeenCalled();
	});

	it('adds its listeners once however often it is started', () => {
		const addListener = vi.spyOn(browserWindow, 'addEventListener');
		const { watcher, onOffline } = createWatcher();

		watcher.start();
		watcher.start();
		goOffline();

		expect(addListener).toHaveBeenCalledTimes(2);
		expect(onOffline).toHaveBeenCalledOnce();
	});

	it('can be started again after stop()', () => {
		const { watcher, onOffline } = createWatcher();

		watcher.start();
		watcher.stop();
		watcher.start();
		goOffline();

		expect(onOffline).toHaveBeenCalledOnce();
	});

	it('does nothing where window is not declared at all (Node, SSR)', () => {
		vi.unstubAllGlobals();
		const { watcher } = createWatcher();

		expect(() => {
			watcher.start();
			watcher.stop();
		}).not.toThrow();
	});

	it.each([
		[
			'no window',
			undefined,
		],
		[
			'a window without addEventListener',
			{},
		],
	])('does nothing where there is %s', (_where, stubbedWindow) => {
		vi.stubGlobal('window', stubbedWindow);
		const { watcher } = createWatcher();

		expect(() => {
			watcher.start();
			watcher.stop();
		}).not.toThrow();
	});
});
