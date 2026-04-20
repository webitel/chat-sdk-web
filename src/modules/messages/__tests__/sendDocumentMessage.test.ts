import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createServiceConfig } from '../../configs';
import { getMessagesService } from '../api/Messages.api';
import type {
	MessageSendDocumentParams,
	MessageSendDocumentRawResponse,
} from '../types/Message.types';
import { sendDocumentMessage } from '../utils/sendDocumentMessage';

vi.mock('../api/Messages.api', () => ({
	getMessagesService: vi.fn(),
}));

const mockUploadFiles = vi.fn();
const mockSendDocumentMessageApi = vi.fn();

const serviceConfig = createServiceConfig({
	baseUrl: 'https://example.test',
	accessToken: 'token',
});

beforeEach(() => {
	vi.mocked(getMessagesService).mockReturnValue({
		getMessageHistory: vi.fn(),
		sendTextMessage: vi.fn(),
		uploadFiles: mockUploadFiles,
		sendDocumentMessage: mockSendDocumentMessageApi,
		sendImageMessage: vi.fn(),
	});
	mockUploadFiles.mockReset();
	mockSendDocumentMessageApi.mockReset();
});

const baseParams = (files: File | File[]): MessageSendDocumentParams => ({
	files,
	to: {
		threadId: 'thread-doc',
	},
	sendId: 'upload-flow-1',
});

describe('sendDocumentMessage', () => {
	it('rejects when neither threadId nor contact.sub is provided', async () => {
		const file = new File([], 'a.pdf', {
			type: 'application/pdf',
		});
		const params = {
			files: [
				file,
			],
			to: {},
		} as MessageSendDocumentParams;

		await expect(sendDocumentMessage(serviceConfig, params)).rejects.toThrow(
			'to.threadId or to.contact.{sub,iss} is required to resolve a storage upload key',
		);
		expect(mockUploadFiles).not.toHaveBeenCalled();
	});

	it('uses `sub:iss` as the upload key when threadId is absent', async () => {
		const file = new File([], 'c.pdf', {
			type: 'application/pdf',
		});
		mockUploadFiles.mockResolvedValue([
			{
				id: 1,
				name: 'c.pdf',
				size: 1,
				mime: 'application/pdf',
				shared: '/s/1',
			},
		]);
		mockSendDocumentMessageApi.mockResolvedValue(
			{} as MessageSendDocumentRawResponse,
		);

		const params: MessageSendDocumentParams = {
			files: file,
			to: {
				contact: {
					sub: 'contact-sub',
					iss: 'contact-iss',
				},
			},
		};

		await sendDocumentMessage(serviceConfig, params);

		expect(mockUploadFiles).toHaveBeenCalledWith('contact-sub:contact-iss', [
			file,
		]);
	});

	it('rejects when no files are provided', async () => {
		const params = {
			files: [],
			to: {
				threadId: 't',
			},
		} as MessageSendDocumentParams;

		await expect(sendDocumentMessage(serviceConfig, params)).rejects.toThrow(
			'At least one file is required to send a document message',
		);
		expect(mockUploadFiles).not.toHaveBeenCalled();
	});

	it('uploads files then sends a document payload built from storage metadata', async () => {
		const f1 = new File(
			[
				'a',
			],
			'one.pdf',
			{
				type: 'application/pdf',
			},
		);
		const f2 = new File(
			[
				'b',
			],
			'two.pdf',
			{
				type: 'application/pdf',
			},
		);
		mockUploadFiles.mockResolvedValue([
			{
				id: 10,
				name: 'one.pdf',
				size: 1,
				mime: 'application/pdf',
				shared: '/s/1',
			},
			{
				id: 20,
				name: 'two.pdf',
				size: 1,
				mime: 'application/pdf',
				shared: '/s/2',
			},
		]);
		const apiResponse = {
			id: 'msg-1',
		} as MessageSendDocumentRawResponse;
		mockSendDocumentMessageApi.mockResolvedValue(apiResponse);

		const params = baseParams([
			f1,
			f2,
		]);
		const result = await sendDocumentMessage(serviceConfig, params);

		expect(result).toBe(apiResponse);
		expect(mockUploadFiles).toHaveBeenCalledWith('thread-doc', [
			f1,
			f2,
		]);
		const { files: _files, ...expectedRest } = params;
		expect(mockSendDocumentMessageApi).toHaveBeenCalledWith(
			expect.objectContaining({
				...expectedRest,
				document: {
					documents: [
						{
							fileName: 'one.pdf',
							id: '10',
							mimeType: 'application/pdf',
							sizeBytes: '1',
						},
						{
							fileName: 'two.pdf',
							id: '20',
							mimeType: 'application/pdf',
							sizeBytes: '1',
						},
					],
				},
			}),
		);
		expect(mockSendDocumentMessageApi.mock.calls[0][0]).not.toHaveProperty(
			'files',
		);
	});

	it('forwards body as document caption and does not leak it at top level', async () => {
		const file = new File([], 'cap.pdf', {
			type: 'application/pdf',
		});
		mockUploadFiles.mockResolvedValue([
			{
				id: 7,
				name: 'cap.pdf',
				size: 2,
				mime: 'application/pdf',
				shared: '/s/7',
			},
		]);
		mockSendDocumentMessageApi.mockResolvedValue(
			{} as MessageSendDocumentRawResponse,
		);

		const params: MessageSendDocumentParams = {
			files: file,
			to: {
				threadId: 'thread-doc',
			},
			body: 'see attached',
		};

		await sendDocumentMessage(serviceConfig, params);

		expect(mockSendDocumentMessageApi).toHaveBeenCalledTimes(1);
		const call = mockSendDocumentMessageApi.mock.calls[0][0];
		expect(call).toMatchObject({
			to: {
				threadId: 'thread-doc',
			},
			document: {
				body: 'see attached',
				documents: [
					{
						fileName: 'cap.pdf',
						id: '7',
						mimeType: 'application/pdf',
						sizeBytes: '2',
					},
				],
			},
		});
		expect(call).not.toHaveProperty('body');
		expect(call).not.toHaveProperty('files');
	});

	it('normalises a single File into an array for upload', async () => {
		const file = new File([], 'solo.pdf', {
			type: 'application/pdf',
		});
		mockUploadFiles.mockResolvedValue([
			{
				id: 3,
				name: 'solo.pdf',
				size: 0,
				mime: 'application/pdf',
				shared: '/x',
			},
		]);
		mockSendDocumentMessageApi.mockResolvedValue(
			{} as MessageSendDocumentRawResponse,
		);

		await sendDocumentMessage(serviceConfig, baseParams(file));

		expect(mockUploadFiles).toHaveBeenCalledWith('thread-doc', [
			file,
		]);
	});
});
