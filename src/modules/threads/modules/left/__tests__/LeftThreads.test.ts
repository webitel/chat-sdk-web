import { describe, expect, it, vi } from 'vitest';

import { createServiceConfig } from '../../../../configs';
import { findLeftThread } from '../utils/findLeftThread';
import { searchLeft } from '../utils/searchLeft';

const setup = () =>
	createServiceConfig({
		baseUrl: 'https://example.test',
		accessToken: 'token',
	});

const mockPages = (
	serviceConfig: ReturnType<typeof setup>,
	pages: {
		ids: string[];
		next: boolean;
	}[],
) => {
	const get = vi.spyOn(serviceConfig.axiosInstance, 'get');
	for (const page of pages) {
		get.mockResolvedValueOnce({
			data: {
				items: page.ids.map((id) => ({
					id,
				})),
				next: page.next,
			},
		});
	}
	return get;
};

const threePages = [
	{
		ids: [
			't-1',
		],
		next: true,
	},
	{
		ids: [
			't-2',
		],
		next: true,
	},
	{
		ids: [
			't-3',
		],
		next: false,
	},
];

describe('searchLeft', () => {
	it('reads GET /v1/threads/left and returns next and the threads', async () => {
		const serviceConfig = setup();
		const get = mockPages(serviceConfig, [
			{
				ids: [
					't-1',
					't-2',
				],
				next: true,
			},
		]);

		const result = await searchLeft(serviceConfig)({
			page: 2,
			size: 50,
		});

		expect(get).toHaveBeenCalledWith('/v1/threads/left', {
			params: {
				page: 2,
				size: 50,
			},
		});
		expect(result.next).toBe(true);
		expect(result.items.map((thread) => thread.id)).toEqual([
			't-1',
			't-2',
		]);
	});

	it('returns threads that can read history but cannot act', async () => {
		const serviceConfig = setup();
		mockPages(serviceConfig, [
			{
				ids: [
					't-1',
				],
				next: false,
			},
		]);

		const [thread] = (await searchLeft(serviceConfig)()).items;

		expect(thread).toHaveProperty('fetchMessageHistory');
		for (const method of [
			'sendMessage',
			'removeMember',
			'transfer',
			'setVariables',
		]) {
			expect(thread).not.toHaveProperty(method);
		}
	});
});

describe('findLeftThread', () => {
	it('pages until it finds the thread', async () => {
		const serviceConfig = setup();
		const get = mockPages(serviceConfig, threePages);

		const thread = await findLeftThread(serviceConfig)('t-3');

		expect(thread?.id).toBe('t-3');
		expect(get).toHaveBeenCalledTimes(3);
		expect(get.mock.calls.map(([, config]) => config?.params)).toEqual([
			{
				page: 1,
				size: 100,
			},
			{
				page: 2,
				size: 100,
			},
			{
				page: 3,
				size: 100,
			},
		]);
	});

	it('returns null once the pages run out', async () => {
		const serviceConfig = setup();
		const get = mockPages(serviceConfig, threePages);

		const thread = await findLeftThread(serviceConfig)('t-9');

		expect(thread).toBeNull();
		expect(get).toHaveBeenCalledTimes(3);
	});

	it('stops on an empty page even when the backend still says next', async () => {
		const serviceConfig = setup();
		const get = mockPages(serviceConfig, [
			{
				ids: [],
				next: true,
			},
		]);

		const thread = await findLeftThread(serviceConfig)('t-1');

		expect(thread).toBeNull();
		expect(get).toHaveBeenCalledTimes(1);
	});
});
