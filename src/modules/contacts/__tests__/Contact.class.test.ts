import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createServiceConfig } from '../../configs';
import { useMessagesService } from '../../messages';
import { MessageAttachmentType } from '../../messages/enums/MessageAttachmentType.enum';
import { createContact } from '../classes/Contact.class';
import type { ContactModel } from '../types/Contact.types';

vi.mock('../../messages', () => ({
	useMessagesService: vi.fn(),
}));

const mockSendTextMessage = vi.fn();
const mockSendDocumentMessage = vi.fn();
const mockSendImageMessage = vi.fn();

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
		sendDocumentMessage: mockSendDocumentMessage,
		sendImageMessage: mockSendImageMessage,
	});
	mockSendTextMessage.mockReset();
	mockSendDocumentMessage.mockReset();
	mockSendImageMessage.mockReset();
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

	it('routes sendMessage through the messages service with contact peer', async () => {
		const contact = createContact(rawContact, {
			serviceConfig,
		});

		await contact.sendMessage(
			{
				body: 'ping',
			},
			{
				sendId: 'c1',
			},
		);

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

	it('defaults body to empty string when omitted', async () => {
		const contact = createContact(rawContact, {
			serviceConfig,
		});

		await contact.sendMessage({});

		expect(mockSendTextMessage).toHaveBeenCalledWith({
			body: '',
			sendId: undefined,
			to: {
				contact: {
					sub: 'contact-sub',
					iss: 'contact-iss',
				},
			},
		});
	});

	it('routes document attachments to sendDocumentMessage', async () => {
		const contact = createContact(rawContact, {
			serviceConfig,
		});
		const file = new File(
			[
				'a',
			],
			'a.pdf',
			{
				type: 'application/pdf',
			},
		);

		await contact.sendMessage(
			{
				body: 'see attached',
				attachments: {
					type: MessageAttachmentType.Documents,
					files: file,
				},
			},
			{
				sendId: 'doc-1',
			},
		);

		expect(mockSendDocumentMessage).toHaveBeenCalledWith({
			files: file,
			body: 'see attached',
			sendId: 'doc-1',
			to: {
				contact: {
					sub: 'contact-sub',
					iss: 'contact-iss',
				},
			},
		});
		expect(mockSendTextMessage).not.toHaveBeenCalled();
		expect(mockSendImageMessage).not.toHaveBeenCalled();
	});

	it('routes image attachments to sendImageMessage', async () => {
		const contact = createContact(rawContact, {
			serviceConfig,
		});
		const image = new File(
			[
				'i',
			],
			'i.png',
			{
				type: 'image/png',
			},
		);

		await contact.sendMessage({
			body: 'cap',
			attachments: {
				type: MessageAttachmentType.Images,
				files: image,
			},
		});

		expect(mockSendImageMessage).toHaveBeenCalledWith({
			files: image,
			body: 'cap',
			sendId: undefined,
			to: {
				contact: {
					sub: 'contact-sub',
					iss: 'contact-iss',
				},
			},
		});
		expect(mockSendDocumentMessage).not.toHaveBeenCalled();
		expect(mockSendTextMessage).not.toHaveBeenCalled();
	});
});
