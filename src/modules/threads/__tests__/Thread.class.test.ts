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

	it('fetches history scoped to this thread', async () => {
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
	});

	it('routes body-only sendMessage to sendTextMessage', async () => {
		const thread = createThread(rawThread, {
			serviceConfig,
		});

		await thread.sendMessage(
			{
				body: 'hi',
			},
			{
				sendId: 'client-msg-1',
			},
		);

		expect(mockSendTextMessage).toHaveBeenCalledWith({
			body: 'hi',
			sendId: 'client-msg-1',
			to: {
				threadId: 'thread-abc',
			},
		});
		expect(mockSendDocumentMessage).not.toHaveBeenCalled();
		expect(mockSendImageMessage).not.toHaveBeenCalled();
	});

	it('routes sendMessage with documents (+ caption) to sendDocumentMessage', async () => {
		const thread = createThread(rawThread, {
			serviceConfig,
		});
		const file = new File([], 'one.pdf', {
			type: 'application/pdf',
		});

		await thread.sendMessage(
			{
				documents: file,
				body: 'see attached',
			},
			{
				sendId: 'client-doc-1',
			},
		);

		expect(mockSendDocumentMessage).toHaveBeenCalledWith({
			files: file,
			body: 'see attached',
			sendId: 'client-doc-1',
			to: {
				threadId: 'thread-abc',
			},
		});
		expect(mockSendTextMessage).not.toHaveBeenCalled();
	});

	it('routes sendMessage with images (+ caption) to sendImageMessage', async () => {
		const thread = createThread(rawThread, {
			serviceConfig,
		});
		const img = new File([], 'pic.png', {
			type: 'image/png',
		});

		await thread.sendMessage({
			images: [
				img,
			],
			body: 'look',
		});

		expect(mockSendImageMessage).toHaveBeenCalledWith({
			files: [
				img,
			],
			body: 'look',
			sendId: undefined,
			to: {
				threadId: 'thread-abc',
			},
		});
	});

	it('prefers images over documents when both provided', async () => {
		const thread = createThread(rawThread, {
			serviceConfig,
		});
		const doc = new File([], 'a.pdf', {
			type: 'application/pdf',
		});
		const img = new File([], 'a.png', {
			type: 'image/png',
		});

		await thread.sendMessage({
			documents: doc,
			images: img,
		});

		expect(mockSendImageMessage).toHaveBeenCalledTimes(1);
		expect(mockSendDocumentMessage).not.toHaveBeenCalled();
	});
});
