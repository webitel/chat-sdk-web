/**
 * @see https://github.com/webitel/im-delivery-service/blob/main/api/asyncapi/asyncapi.yaml#L56
 */
export const ChatsSocketMessage = {
	Connected: 'connectedEvent',
	Disconnected: 'disconnectedEvent',
	Error: 'errorEvent',
	ThreadMessage: 'messageEvent',
	ThreadCreated: 'threadCreatedEvent',
	MemberAdded: 'memberAddedEvent',
	MemberLeft: 'memberLeftEvent',
	Ack: 'ackEvent',
	Ping: 'pingEvent',
} as const;

export type ChatsSocketMessage =
	(typeof ChatsSocketMessage)[keyof typeof ChatsSocketMessage];
