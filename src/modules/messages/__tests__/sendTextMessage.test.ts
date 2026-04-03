import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createServiceConfig } from '../../configs';
import { getMessagesService } from '../api/Messages.api';
import type { MessageSendTextRawResponse } from '../types/Message.types';
import { sendTextMessage } from '../utils/sendTextMessage';

vi.mock('../api/Messages.api', () => ({
	getMessagesService: vi.fn(),
}));

const mockSendTextMessage = vi.fn();

const serviceConfig = createServiceConfig({
	baseUrl: 'https://example.test',
	accessToken: 'token',
});

beforeEach(() => {
	vi.mocked(getMessagesService).mockReturnValue({
		getMessageHistory: vi.fn(),
		sendTextMessage: mockSendTextMessage,
		uploadFiles: vi.fn(),
		sendDocumentMessage: vi.fn(),
		sendImageMessage: vi.fn(),
	});
	mockSendTextMessage.mockReset();
});

describe('sendTextMessage', () => {
	it('delegates to the messages API with the same params', async () => {
		const raw = {
			id: 'sent-1',
		} as MessageSendTextRawResponse;
		mockSendTextMessage.mockResolvedValue(raw);

		const params = {
			body: 'hello',
			to: {
				threadId: 't-1',
			},
			sendId: 'client-1',
		};

		const result = await sendTextMessage(serviceConfig, params);

		expect(result).toBe(raw);
		expect(mockSendTextMessage).toHaveBeenCalledWith(params);
	});
});
