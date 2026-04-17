import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createServiceConfig } from '../../configs';
import { getMessagesService } from '../api/Messages.api';
import type {
	MessageSendImageParams,
	MessageSendImageRawResponse,
} from '../types/Message.types';
import { sendImageMessage } from '../utils/sendImageMessage';

vi.mock('../api/Messages.api', () => ({
	getMessagesService: vi.fn(),
}));

const mockUploadFiles = vi.fn();
const mockSendImageMessageApi = vi.fn();

const serviceConfig = createServiceConfig({
	baseUrl: 'https://example.test',
	accessToken: 'token',
});

beforeEach(() => {
	vi.mocked(getMessagesService).mockReturnValue({
		getMessageHistory: vi.fn(),
		sendTextMessage: vi.fn(),
		uploadFiles: mockUploadFiles,
		sendDocumentMessage: vi.fn(),
		sendImageMessage: mockSendImageMessageApi,
	});
	mockUploadFiles.mockReset();
	mockSendImageMessageApi.mockReset();
});

const baseParams = (files: File | File[]): MessageSendImageParams => ({
	files,
	to: {
		threadId: 'thread-img',
	},
});

describe('sendImageMessage', () => {
	it('rejects when threadId is missing', async () => {
		const file = new File([], 'a.png', {
			type: 'image/png',
		});
		const params = {
			files: [
				file,
			],
			to: {},
		} as MessageSendImageParams;

		await expect(sendImageMessage(serviceConfig, params)).rejects.toThrow(
			'threadId is required to send an image message',
		);
		expect(mockUploadFiles).not.toHaveBeenCalled();
	});

	it('rejects when no files are provided', async () => {
		const params = {
			files: [],
			to: {
				threadId: 't',
			},
		} as MessageSendImageParams;

		await expect(sendImageMessage(serviceConfig, params)).rejects.toThrow(
			'At least one file is required to send an image message',
		);
		expect(mockUploadFiles).not.toHaveBeenCalled();
	});

	it('forwards body as image caption and does not leak it at top level', async () => {
		const img = new File([], 'cap.png', {
			type: 'image/png',
		});
		mockUploadFiles.mockResolvedValue([
			{
				id: 55,
				name: 'cap.png',
				size: 4,
				mime: 'image/png',
				shared: '/s/55',
			},
		]);
		mockSendImageMessageApi.mockResolvedValue(
			{} as MessageSendImageRawResponse,
		);

		const params: MessageSendImageParams = {
			files: img,
			to: {
				threadId: 'thread-img',
			},
			body: 'look at this',
		};

		await sendImageMessage(serviceConfig, params);

		expect(mockSendImageMessageApi).toHaveBeenCalledTimes(1);
		const call = mockSendImageMessageApi.mock.calls[0][0];
		expect(call).toMatchObject({
			to: {
				threadId: 'thread-img',
			},
			image: {
				body: 'look at this',
				images: [
					{
						id: '55',
						mimeType: 'image/png',
						name: 'cap.png',
					},
				],
			},
		});
		expect(call).not.toHaveProperty('body');
		expect(call).not.toHaveProperty('files');
	});

	it('uploads files then sends an image payload built from storage metadata', async () => {
		const img = new File([], 'pic.png', {
			type: 'image/png',
		});
		mockUploadFiles.mockResolvedValue([
			{
				id: 99,
				name: 'pic.png',
				size: 10,
				mime: 'image/png',
				shared: '/s/p',
			},
		]);
		const apiResponse = {
			id: 'img-msg',
		} as MessageSendImageRawResponse;
		mockSendImageMessageApi.mockResolvedValue(apiResponse);

		const params = baseParams(img);
		const result = await sendImageMessage(serviceConfig, params);

		expect(result).toBe(apiResponse);
		expect(mockUploadFiles).toHaveBeenCalledWith('thread-img', [
			img,
		]);
		const { files: _files, ...expectedRest } = params;
		expect(mockSendImageMessageApi).toHaveBeenCalledWith(
			expect.objectContaining({
				...expectedRest,
				image: {
					images: [
						{
							id: '99',
							mimeType: 'image/png',
							name: 'pic.png',
						},
					],
				},
			}),
		);
		expect(mockSendImageMessageApi.mock.calls[0][0]).not.toHaveProperty(
			'files',
		);
	});
});
