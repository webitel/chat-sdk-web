/**
 * Each value is the camelCased key of the server frame's `payload`.
 *
 * @see https://github.com/webitel/im-delivery-service/blob/main/api/asyncapi/asyncapi.yaml `EventPayload`
 */
export const ChatsSocketMessage = {
	Connected: 'connectedEvent',
	Disconnected: 'disconnectedEvent',
	Resync: 'resyncEvent',
	Error: 'errorEvent',
	ThreadMessage: 'messageEvent',
	MessageEdited: 'messageEditedEvent',
	MessageDeleted: 'messageDeletedEvent',
	MessageStatus: 'messageStatusEvent',
	MessageReaction: 'messageReactionEvent',
	Typing: 'typingEvent',
	ThreadCreated: 'threadCreatedEvent',
	MemberAdded: 'memberAddedEvent',
	MemberLeft: 'memberLeftEvent',
	ThreadTagsChanged: 'threadTagsChangedEvent',
	InteractiveCallback: 'interactiveCallback',
	VariableSet: 'variableSetEvent',
	VariableFlush: 'variableFlushEvent',
	Ack: 'ackEvent',
	Ping: 'pingEvent',
} as const;

export type ChatsSocketMessage =
	(typeof ChatsSocketMessage)[keyof typeof ChatsSocketMessage];
