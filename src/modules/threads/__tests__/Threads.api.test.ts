import { describe, expect, it, vi } from 'vitest';

import { createServiceConfig } from '../../configs';
import { getThreadsService } from '../api/Threads.api';

describe('getThreadsService', () => {
	it('sends tag filters to GET /v1/threads in snake_case', async () => {
		const serviceConfig = createServiceConfig({
			baseUrl: 'https://example.test',
			accessToken: 'token',
		});
		const get = vi.spyOn(serviceConfig.axiosInstance, 'get').mockResolvedValue({
			data: {
				items: [],
			},
		});

		await getThreadsService(serviceConfig).getThreadsList({
			tags: [
				'snoozed',
			],
			excludeTags: [
				'snoozed',
			],
		});

		expect(get).toHaveBeenCalledWith('/v1/threads', {
			params: {
				tags: [
					'snoozed',
				],
				exclude_tags: [
					'snoozed',
				],
			},
		});
	});
});
