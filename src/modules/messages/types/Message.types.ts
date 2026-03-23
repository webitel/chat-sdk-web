import type {
    WebitelImApiGatewayV1HistoryMessage as MessageModel,
    MessageHistorySearchThreadMessagesHistoryWebitelImApiGatewayV1MessageHistoryParams as MessageHistorySearchParams,
    WebitelImApiGatewayV1SearchMessageHistoryResponse as MessageHistorySearchRawResponse,
} from '@webitel/api-services/gen/models';

interface IMessage extends MessageModel {
    markRead: () => Promise<void>;
}

/**
 * API response with `messages` replaced by instantiated SDK `Message` classes.
 */
type MessageHistorySearchResult = Omit<MessageHistorySearchRawResponse, 'messages'> & {
    messages: IMessage[];
};

export type {
    MessageModel,
    IMessage,
    MessageHistorySearchParams,
    MessageHistorySearchResult,
};
