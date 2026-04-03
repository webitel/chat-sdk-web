import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createServiceConfig } from '../../configs';
import { useMessagesService } from '../../messages';
import { createContact } from '../classes/Contact.class';
import type { ContactModel } from '../types/Contact.types';

vi.mock('../../messages', () => ({
	useMessagesService: vi.fn(),
}));

const mockSendTextMessage = vi.fn();

const serviceConfig = createServiceConfig({
	baseUrl: 'https://example.test',
	accessToken: 'token',
});

const rawContact = {
	sub: 'contact-sub',
	iss: 'contact-iss',
} as ContactModel;

beforeEach(() => {
	vi.mocked(useMessagesService).mockReturnValue({
		fetchMessageHistory: vi.fn(),
		sendTextMessage: mockSendTextMessage,
		sendDocumentMessage: vi.fn(),
		sendImageMessage: vi.fn(),
	});
	mockSendTextMessage.mockReset();
});

describe('createContact', () => {
	it('exposes identity fields and serviceConfig', () => {
		const contact = createContact(rawContact, {
			serviceConfig,
		});

		expect(contact.sub).toBe('contact-sub');
		expect(contact.iss).toBe('contact-iss');
		expect(contact.serviceConfig).toBe(serviceConfig);
	});

	it('routes sendTextMessage through the messages service with contact peer', async () => {
		const contact = createContact(rawContact, {
			serviceConfig,
		});

		await contact.sendTextMessage('ping', {
			sendId: 'c1',
		});

		expect(useMessagesService).toHaveBeenCalledWith(serviceConfig);
		expect(mockSendTextMessage).toHaveBeenCalledWith({
			body: 'ping',
			sendId: 'c1',
			to: {
				contact: {
					sub: 'contact-sub',
					iss: 'contact-iss',
				},
			},
		});
	});
});
