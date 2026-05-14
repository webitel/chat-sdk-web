import { describe, expect, it } from 'vitest';
import { createServiceConfig } from '../../configs';
import { ChatsSocketMessage } from '../enums/ChatsSocketMessage.enum';
import type { EventPayload } from '../types/WsEventPayload.types';
import { processSocketEventPayload } from '../utils/processSocketEventPayload';

const testCtx = () => ({
	serviceConfig: createServiceConfig({
		baseUrl: 'https://api.example.test',
		accessToken: 'token',
	}),
});

describe('processSocketEventPayload', () => {
	it('throws when no recognised branch is set on the payload', () => {
		const payload: EventPayload = {};

		expect(() => processSocketEventPayload(payload, testCtx())).toThrow(
			/^Unknown event:/,
		);
	});

	it('maps connectedEvent to Connected with that payload', () => {
		const connected: EventPayload['connectedEvent'] = {
			ok: true,
			connectionId: 'conn-id',
			serverVersion: '1.0.0',
		};
		const payload: EventPayload = {
			connectedEvent: connected,
		};

		expect(processSocketEventPayload(payload, testCtx())).toEqual({
			eventName: ChatsSocketMessage.Connected,
			eventPayload: connected,
		});
	});
});
