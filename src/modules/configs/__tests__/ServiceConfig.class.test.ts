import { describe, expect, it } from 'vitest';

import { createServiceConfig } from '../serviceConfig/ServiceConfig.class';

describe('createServiceConfig', () => {
	it('configures axios base URL and static access header', () => {
		const cfg = createServiceConfig({
			baseUrl: 'https://api.example',
			accessToken: 'static-token',
		});

		expect(cfg.baseUrl).toBe('https://api.example');
		expect(cfg.axiosInstance.defaults.baseURL).toBe('https://api.example');
		expect(cfg.axiosInstance.defaults.headers.common['X-Webitel-Access']).toBe(
			'static-token',
		);
	});

	it('uses an interceptor for a function accessToken instead of default header', () => {
		const cfg = createServiceConfig({
			baseUrl: 'https://api.example',
			accessToken: () => 'dynamic',
		});

		expect(
			cfg.axiosInstance.defaults.headers.common['X-Webitel-Access'],
		).toBeUndefined();
	});
});
