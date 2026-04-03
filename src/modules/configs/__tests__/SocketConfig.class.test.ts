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
});
