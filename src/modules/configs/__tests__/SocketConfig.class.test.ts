import { describe, expect, it } from 'vitest';

import { createSocketConfig } from '../socketConfig/SocketConfig.class';

describe('createSocketConfig', () => {
	it('stores baseUrl and accessToken on the instance', () => {
		const cfg = createSocketConfig({
			baseUrl: 'wss://ws.example/stream',
			accessToken: 'ws-secret',
		});

		expect(cfg.baseUrl).toBe('wss://ws.example/stream');
		expect(cfg.accessToken).toBe('ws-secret');
	});

	it('keeps an accessToken getter as-is, to be called on every connect', () => {
		const getter = () => 'fresh-token';
		const cfg = createSocketConfig({
			baseUrl: 'wss://ws.example/stream',
			accessToken: getter,
		});

		expect(cfg.accessToken).toBe(getter);
	});
});
