import { describe, expect, it, vi } from 'vitest';

import { createServiceConfig } from '../../../../configs';
import { snooze } from '../utils/snooze';
import { unsnooze } from '../utils/unsnooze';

const setup = () =>
	createServiceConfig({
		baseUrl: 'https://example.test',
		accessToken: 'token',
	});

describe('thread snooze', () => {
	it('snoozes with POST /v1/threads/{threadId}/snooze', async () => {
		const serviceConfig = setup();
		const post = vi
			.spyOn(serviceConfig.axiosInstance, 'post')
			.mockResolvedValue({
				data: {},
			});

		await snooze(serviceConfig)('t-1');

		expect(post).toHaveBeenCalledWith('/v1/threads/t-1/snooze');
	});

	it('unsnoozes with DELETE /v1/threads/{threadId}/snooze', async () => {
		const serviceConfig = setup();
		const remove = vi
			.spyOn(serviceConfig.axiosInstance, 'delete')
			.mockResolvedValue({
				data: {},
			});

		await unsnooze(serviceConfig)('t-1');

		expect(remove).toHaveBeenCalledWith('/v1/threads/t-1/snooze');
	});
});
