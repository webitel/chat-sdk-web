import { ChatsSocketMessage } from '../enums/ChatsSocketMessage.enum';
import type { ChatsSocketClientEventPayloadMap } from './ChatsSocketClientEventsPayload.types';
import type { SocketMessageModel } from './models/SocketMessageModel.types';
import type { SocketThreadModel } from './models/SocketThreadModel.types';

export interface EventPayload {
	connectedEvent?: ChatsSocketClientEventPayloadMap[typeof ChatsSocketMessage.Connected];
	disconnectedEvent?: ChatsSocketClientEventPayloadMap[typeof ChatsSocketMessage.Disconnected];
	messageEvent?: SocketMessageModel;
	threadCreatedEvent?: SocketThreadModel;
	ackEvent?: ChatsSocketClientEventPayloadMap[typeof ChatsSocketMessage.Ack];
	errorEvent?: ChatsSocketClientEventPayloadMap[typeof ChatsSocketMessage.Error];
	pingEvent?: ChatsSocketClientEventPayloadMap[typeof ChatsSocketMessage.Ping];
}
