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
		expect(mockSendImageMessageApi).toHaveBeenCalledWith(
			expect.objectContaining({
				...params,
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
	});
});
