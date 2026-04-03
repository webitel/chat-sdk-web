import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createServiceConfig } from '../../configs';
import { getMessagesService } from '../api/Messages.api';
import { fetchMessageHistory } from '../utils/fetchMessageHistory';

vi.mock('../api/Messages.api', () => ({
	getMessagesService: vi.fn(),
}));

const mockGetMessageHistory = vi.fn();

const serviceConfig = createServiceConfig({
	baseUrl: 'https://example.test',
	accessToken: 'token',
});

beforeEach(() => {
	vi.mocked(getMessagesService).mockReturnValue({
		getMessageHistory: mockGetMessageHistory,
		sendTextMessage: vi.fn(),
		uploadFiles: vi.fn(),
		sendDocumentMessage: vi.fn(),
		sendImageMessage: vi.fn(),
	});
	mockGetMessageHistory.mockReset();
});

describe('fetchMessageHistory', () => {
	it('wraps list items in Message instances that keep the same ServiceConfig', async () => {
		mockGetMessageHistory.mockResolvedValue({
			items: [
				{
					id: 'm-1',
				},
				{
					id: 'm-2',
				},
			],
			nextCursor: {
				cursorId: 'c1',
			},
		});

		const result = await fetchMessageHistory(serviceConfig, 'thread-1');

		expect(result.items).toHaveLength(2);
		expect(result.items[0]?.id).toBe('m-1');
		expect(result.items[1]?.id).toBe('m-2');
		expect(result.items[0]?.serviceConfig).toBe(serviceConfig);
		expect(result.nextCursor).toEqual({
			cursorId: 'c1',
		});
	});

	it('normalises missing items to an empty Message list', async () => {
		mockGetMessageHistory.mockResolvedValue({
			items: undefined,
		});

		const result = await fetchMessageHistory(serviceConfig, 'thread-1');

		expect(result.items).toEqual([]);
	});

	it('forwards thread id and search params to the API', async () => {
		mockGetMessageHistory.mockResolvedValue({
			items: [],
		});

		await fetchMessageHistory(serviceConfig, 'thread-xyz', {
			size: 50,
			cursorId: 'abc',
		});

		expect(mockGetMessageHistory).toHaveBeenCalledWith('thread-xyz', {
			size: 50,
			cursorId: 'abc',
		});
	});
});
