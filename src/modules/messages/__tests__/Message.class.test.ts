import { describe, expect, it } from 'vitest';

import { createServiceConfig } from '../../configs';
import { createMessage } from '../classes/Message.class';
import type { MessageModel } from '../types/Message.types';

const serviceConfig = createServiceConfig({
	baseUrl: 'https://example.test',
	accessToken: 'token',
});

const rawMessage = {
	id: 'msg-raw-1',
} as MessageModel;

describe('createMessage', () => {
	it('exposes message fields and serviceConfig from the model + constructor', () => {
		const message = createMessage(rawMessage, {
			serviceConfig,
		});

		expect(message.id).toBe('msg-raw-1');
		expect(message.serviceConfig).toBe(serviceConfig);
	});

	it('markRead is not implemented yet', async () => {
		const message = createMessage(rawMessage, {
			serviceConfig,
		});

		await expect(message.markRead()).rejects.toThrow('Method not implemented.');
	});
});
