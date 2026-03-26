import type {
	MessageHistorySearchThreadMessagesHistoryWebitelImApiGatewayV1MessageHistoryParams as MessageHistorySearchParams,
	WebitelImApiGatewayV1SearchMessageHistoryResponse as MessageHistorySearchRawResponse,
	WebitelImApiGatewayV1HistoryMessage as MessageModel,
	WebitelImApiGatewayV1SendTextRequest as MessageSendTextParams,
	WebitelImApiGatewayV1SendTextResponse as MessageSendTextRawResponse,
} from '@webitel/api-services/gen/models';

interface IMessage extends MessageModel {
	markRead: () => Promise<void>;
}

/**
 * API response with `messages` replaced by instantiated SDK `Message` classes.
 */
type MessageHistorySearchResult = Omit<
	MessageHistorySearchRawResponse,
	'messages'
> & {
	messages: IMessage[];
};

export type {
	IMessage,
	MessageHistorySearchParams,
	MessageHistorySearchRawResponse,
	MessageHistorySearchResult,
	MessageModel,
	MessageSendTextParams,
	MessageSendTextRawResponse,
};
