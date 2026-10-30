import type { ServiceConfig } from '../../configs';
import type { MessageModel } from '../../messages/types/Message.types';
import type { ThreadModel } from '../../threads/types/Thread.types';
import { ChatsSocketMessage } from '../enums/ChatsSocketMessage.enum';
import type { ChatsSocketClientEventPayloadMap } from '../types/ChatsSocketClientEventsPayload.types';
import type { EventPayload } from '../types/WsEventPayload.types';
import { instantiateSocketEventEntities } from './instantiateSocketEventEntities';

const socketMessages = Object.values(ChatsSocketMessage);

/** The enum values are the payload keys; `null` for a key this SDK does not know. */
function getSocketMessageNameFromEvent(
	sourceEvent: EventPayload,
): ChatsSocketMessage | null {
	return socketMessages.find((name) => sourceEvent[name] != null) ?? null;
}

/**
 * `null` when the event is unknown to this SDK: the server may add events, and
 * clients are to ignore keys they do not know.
 */
export function processSocketEventPayload(
	sourceEvent: EventPayload,
	{
		serviceConfig,
	}: {
		serviceConfig: ServiceConfig;
	},
): {
	eventName: ChatsSocketMessage;
	eventPayload: ChatsSocketClientEventPayloadMap[ChatsSocketMessage];
} | null {
	const eventName = getSocketMessageNameFromEvent(sourceEvent);
	if (!eventName) {
		return null;
	}
	const eventPayload = processEventPayload(
		{
			name: eventName,
			payload: sourceEvent[eventName],
		},
		{
			serviceConfig,
		},
	);
	return {
		eventName,
		eventPayload,
	};
}

function processEventPayload(
	{
		name,
		payload,
	}: {
		name: ChatsSocketMessage;
		payload: unknown;
	},
	{
		serviceConfig,
	}: {
		serviceConfig: ServiceConfig;
	},
): ChatsSocketClientEventPayloadMap[ChatsSocketMessage] {
	switch (name) {
		case ChatsSocketMessage.ThreadMessage:
			return instantiateSocketEventEntities(
				{
					name,
					payload: payload as MessageModel,
				},
				{
					serviceConfig,
				},
			);
		case ChatsSocketMessage.ThreadCreated:
			return instantiateSocketEventEntities(
				{
					name,
					payload: payload as ThreadModel,
				},
				{
					serviceConfig,
				},
			);
		case ChatsSocketMessage.ThreadTagsChanged: {
			const changed = payload as NonNullable<
				EventPayload[typeof ChatsSocketMessage.ThreadTagsChanged]
			>;
			return {
				...changed,
				tags: changed.tags ?? [],
			};
		}
		case ChatsSocketMessage.VariableSet:
		case ChatsSocketMessage.VariableFlush: {
			const { variables = {}, action } = payload as NonNullable<
				EventPayload[typeof ChatsSocketMessage.VariableSet]
			>;
			return {
				action,
				variables: Object.fromEntries(
					Object.entries(variables).map(([key, variable]) => [
						key,
						{
							value: variable.value,
							setBy: variable.set_by,
							setAt: variable.set_at,
						},
					]),
				),
			};
		}
		case ChatsSocketMessage.Connected:
		case ChatsSocketMessage.Disconnected:
		case ChatsSocketMessage.Resync:
		case ChatsSocketMessage.Error:
		case ChatsSocketMessage.MessageEdited:
		case ChatsSocketMessage.MessageDeleted:
		case ChatsSocketMessage.MessageStatus:
		case ChatsSocketMessage.MessageReaction:
		case ChatsSocketMessage.Typing:
		case ChatsSocketMessage.MemberAdded:
		case ChatsSocketMessage.MemberLeft:
		case ChatsSocketMessage.InteractiveCallback:
		case ChatsSocketMessage.Ack:
		case ChatsSocketMessage.Ping:
			return payload as ChatsSocketClientEventPayloadMap[typeof name];
		default: {
			const _exhaustive: never = name;
			return _exhaustive;
		}
	}
}
