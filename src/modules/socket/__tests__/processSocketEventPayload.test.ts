import { describe, expect, it } from 'vitest';

import { ConnectedPayload } from '../../../gen/ws/ConnectedPayload';
import { EventPayload } from '../../../gen/ws/EventPayload';
import { ChatsSocketMessage } from '../enums/ChatsSocketMessage.enum';
import { processSocketEventPayload } from '../utils/processSocketEventPayload';

describe('processSocketEventPayload', () => {
	it('throws when no recognised branch is set on the payload', () => {
		const payload = new EventPayload({});

		expect(() => processSocketEventPayload(payload)).toThrow(/^Unknown event:/);
	});

	it('maps connectedEvent to Connected with that payload', () => {
		const connected = new ConnectedPayload({
			ok: true,
		});
		const payload = new EventPayload({
			connectedEvent: connected,
		});

		expect(processSocketEventPayload(payload)).toEqual({
			eventName: ChatsSocketMessage.Connected,
			eventPayload: connected,
		});
	});
});
