import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createServiceConfig } from '../../configs';
import { useMessagesService } from '../../messages';
import { createThread } from '../classes/Thread.class';
import type { ThreadModel } from '../types/Thread.types';

vi.mock('../../messages', () => ({
	useMessagesService: vi.fn(),
}));

const mockFetchMessageHistory = vi.fn();
const mockSendTextMessage = vi.fn();
const mockSendDocumentMessage = vi.fn();
const mockSendImageMessage = vi.fn();

const serviceConfig = createServiceConfig({
	baseUrl: 'https://example.test',
	accessToken: 'token',
});

const rawThread = {
	id: 'thread-abc',
} as ThreadModel;

beforeEach(() => {
	vi.mocked(useMessagesService).mockReturnValue({
		fetchMessageHistory: mockFetchMessageHistory,
		sendTextMessage: mockSendTextMessage,
		sendDocumentMessage: mockSendDocumentMessage,
		sendImageMessage: mockSendImageMessage,
	});
	mockFetchMessageHistory.mockReset();
	mockSendTextMessage.mockReset();
	mockSendDocumentMessage.mockReset();
	mockSendImageMessage.mockReset();
});

describe('createThread', () => {
	it('exposes the same thread id and config as the underlying model + constructor', () => {
		const thread = createThread(rawThread, {
			serviceConfig,
		});

		expect(thread.id).toBe('thread-abc');
		expect(thread.serviceConfig).toBe(serviceConfig);
	});

	it('delegates message operations to the messages service scoped to this thread', async () => {
		const thread = createThread(rawThread, {
			serviceConfig,
		});

		await thread.fetchMessageHistory({
			size: 10,
		});
		expect(useMessagesService).toHaveBeenCalledWith(serviceConfig);
		expect(mockFetchMessageHistory).toHaveBeenCalledWith('thread-abc', {
			size: 10,
		});

		await thread.sendTextMessage('hi', {
			sendId: 'client-msg-1',
		});
		expect(mockSendTextMessage).toHaveBeenCalledWith({
			body: 'hi',
			sendId: 'client-msg-1',
			to: {
				threadId: 'thread-abc',
			},
		});
	});

	it('normalises a single file to an array for document and image sends', async () => {
		const thread = createThread(rawThread, {
			serviceConfig,
		});
		const file = new File([], 'one.pdf', {
			type: 'application/pdf',
		});

		await thread.sendDocumentMessage(file, {
			sendId: 'client-doc-1',
		});
		expect(mockSendDocumentMessage).toHaveBeenCalledWith({
			files: [
				file,
			],
			sendId: 'client-doc-1',
			to: {
				threadId: 'thread-abc',
			},
		});

		const img = new File([], 'pic.png', {
			type: 'image/png',
		});
		await thread.sendImageMessage([
			img,
		]);
		expect(mockSendImageMessage).toHaveBeenCalledWith({
			files: [
				img,
			],
			to: {
				threadId: 'thread-abc',
			},
		});
	});
});
