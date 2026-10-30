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
	it('returns null when no known key is set, so new server events are ignored', () => {
		expect(processSocketEventPayload({}, testCtx())).toBeNull();
		expect(
			processSocketEventPayload(
				{
					someFutureEvent: {},
				} as EventPayload,
				testCtx(),
			),
		).toBeNull();
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
	it('maps threadTagsChangedEvent to ThreadTagsChanged with that payload', () => {
		const changed: EventPayload['threadTagsChangedEvent'] = {
			threadId: 't-1',
			tags: [
				'snoozed',
			],
			updatesCursor: 'cursor',
		};
		const payload: EventPayload = {
			threadTagsChangedEvent: changed,
		};

		expect(processSocketEventPayload(payload, testCtx())).toEqual({
			eventName: ChatsSocketMessage.ThreadTagsChanged,
			eventPayload: changed,
		});
	});

	it('reads omitted tags as none, since protobuf JSON drops an empty list', () => {
		const payload: EventPayload = {
			threadTagsChangedEvent: {
				threadId: 't-1',
				updatesCursor: 'cursor',
			},
		};

		expect(processSocketEventPayload(payload, testCtx())?.eventPayload).toEqual(
			{
				threadId: 't-1',
				tags: [],
				updatesCursor: 'cursor',
			},
		);
	});
});
