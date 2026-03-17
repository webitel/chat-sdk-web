/**
 * @see https://github.com/webitel/im-delivery-service/blob/main/api/asyncapi/asyncapi.yaml#L56
 */
export const ChatsSocketMessage = {
    ThreadMessage: 'message',
    ThreadCreated: 'thread_created',
} as const;

export type ChatsSocketMessage = (typeof ChatsSocketMessage)[keyof typeof ChatsSocketMessage];