import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createServiceConfig } from '../../configs';
import { getThreadsService } from '../api/Threads.api';
import { fetchThreads } from '../utils/fetchThreads';

vi.mock('../api/Threads.api', () => ({
	getThreadsService: vi.fn(),
}));

const mockGetThreadsList = vi.fn();

const serviceConfig = createServiceConfig({
	baseUrl: 'https://example.test',
	accessToken: 'token',
});

beforeEach(() => {
	vi.mocked(getThreadsService).mockReturnValue({
		getThreadsList: mockGetThreadsList,
		addMember: vi.fn(),
		removeMember: vi.fn(),
	});
	mockGetThreadsList.mockReset();
});

describe('fetchThreads', () => {
	it('wraps list items in Thread instances that keep the same ServiceConfig', async () => {
		mockGetThreadsList.mockResolvedValue({
			items: [
				{
					id: 't-1',
				},
				{
					id: 't-2',
				},
			],
			next: 'cursor',
		});

		const result = await fetchThreads(serviceConfig);

		expect(result.items).toHaveLength(2);
		expect(result.items[0]?.id).toBe('t-1');
		expect(result.items[1]?.id).toBe('t-2');
		expect(result.items[0]?.serviceConfig).toBe(serviceConfig);
		expect(result.next).toBe('cursor');
	});

	it('normalises missing items to an empty Thread list', async () => {
		mockGetThreadsList.mockResolvedValue({
			items: undefined,
		});

		const result = await fetchThreads(serviceConfig);

		expect(result.items).toEqual([]);
	});

	it('forwards search params to the threads API', async () => {
		mockGetThreadsList.mockResolvedValue({
			items: [],
		});

		await fetchThreads(serviceConfig, {
			size: 25,
			page: 2,
		});

		expect(mockGetThreadsList).toHaveBeenCalledWith({
			size: 25,
			page: 2,
		});
	});
});
