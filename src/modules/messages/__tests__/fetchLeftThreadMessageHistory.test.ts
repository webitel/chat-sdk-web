import { describe, expect, it, vi } from 'vitest';

import { createServiceConfig } from '../../configs';
import { fetchLeftThreadMessageHistory } from '../utils/fetchLeftThreadMessageHistory';

const setup = () =>
	createServiceConfig({
		baseUrl: 'https://example.test',
		accessToken: 'token',
	});

describe('fetchLeftThreadMessageHistory', () => {
	it('reads GET /v1/threads/{threadId}/left_threads/messages with snake_case params', async () => {
		const serviceConfig = setup();
		const get = vi.spyOn(serviceConfig.axiosInstance, 'get').mockResolvedValue({
			data: {
				items: [],
			},
		});

		await fetchLeftThreadMessageHistory(serviceConfig, 't-1', {
			size: 30,
			cursorId: 'abc',
		});

		expect(get).toHaveBeenCalledWith('/v1/threads/t-1/left_threads/messages', {
			params: {
				size: 30,
				cursor_id: 'abc',
			},
		});
	});

	it('wraps items in Message instances and camel-cases the cursor', async () => {
		const serviceConfig = setup();
		vi.spyOn(serviceConfig.axiosInstance, 'get').mockResolvedValue({
			data: {
				items: [
					{
						id: 'm-1',
					},
					{
						id: 'm-2',
					},
				],
				next_cursor: {
					cursor_id: 'c1',
				},
			},
		});

		const result = await fetchLeftThreadMessageHistory(serviceConfig, 't-1');

		expect(result.items.map((message) => message.id)).toEqual([
			'm-1',
			'm-2',
		]);
		expect(result.items[0]?.serviceConfig).toBe(serviceConfig);
		expect(result.nextCursor).toEqual({
			cursorId: 'c1',
		});
	});

	it('normalises missing items to an empty list', async () => {
		const serviceConfig = setup();
		vi.spyOn(serviceConfig.axiosInstance, 'get').mockResolvedValue({
			data: {},
		});

		const result = await fetchLeftThreadMessageHistory(serviceConfig, 't-1');

		expect(result.items).toEqual([]);
	});
});
