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

	it.each([
		[
			ChatsSocketMessage.Resync,
			{
				cursor: 'c-1',
			},
		],
		[
			ChatsSocketMessage.MessageDeleted,
			{
				id: 'm-1',
				threadId: 't-1',
				createdAt: 1,
				deletedAt: 2,
			},
		],
		[
			ChatsSocketMessage.MessageReaction,
			{
				messageId: 'm-1',
				threadId: 't-1',
				reactions: [],
			},
		],
		[
			ChatsSocketMessage.Typing,
			{
				threadId: 't-1',
				timeoutMs: 5000,
			},
		],
		[
			ChatsSocketMessage.InteractiveCallback,
			{
				threadId: 't-1',
				buttonCode: 'yes',
			},
		],
	])('maps %s to that event with its payload', (eventName, body) => {
		const payload = {
			[eventName]: body,
		} as EventPayload;

		expect(processSocketEventPayload(payload, testCtx())).toEqual({
			eventName,
			eventPayload: body,
		});
	});

	it.each([
		ChatsSocketMessage.VariableSet,
		ChatsSocketMessage.VariableFlush,
	])('%s keeps variable names and camelCases each entry', (eventName) => {
		const payload = {
			[eventName]: {
				action: 'set',
				variables: {
					customer_name: {
						value: 'Ann',
						set_by: 'u-1',
						set_at: '1',
					},
				},
			},
		} as EventPayload;

		expect(processSocketEventPayload(payload, testCtx())?.eventPayload).toEqual(
			{
				action: 'set',
				variables: {
					customer_name: {
						value: 'Ann',
						setBy: 'u-1',
						setAt: '1',
					},
				},
			},
		);
	});

	it('reads omitted variables as none', () => {
		const payload: EventPayload = {
			variableFlushEvent: {
				action: 'flush',
			},
		};

		expect(processSocketEventPayload(payload, testCtx())?.eventPayload).toEqual(
			{
				action: 'flush',
				variables: {},
			},
		);
	});
});
