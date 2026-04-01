import type {
	MessageHistorySearchThreadMessagesHistoryWebitelImApiGatewayV1MessageHistoryParams as MessageHistorySearchParams,
	WebitelImApiGatewayV1SearchMessageHistoryResponse as MessageHistorySearchRawResponse,
	WebitelImApiGatewayV1HistoryMessage as MessageModel,
	WebitelImApiGatewayV1SendDocumentResponse as MessageSendFileRawResponse,
	WebitelImApiGatewayV1SendImageResponse as MessageSendImageRawResponse,
	WebitelImApiGatewayV1SendTextRequest as MessageSendTextParams,
	WebitelImApiGatewayV1SendTextResponse as MessageSendTextRawResponse,
	StorageUploadFileResponse as MessageUploadFileRawResponse,
	WebitelImApiGatewayV1SendDocumentRequest,
	WebitelImApiGatewayV1SendImageRequest,
} from '@webitel/api-services/gen/models';

interface IMessage extends MessageModel {
	markRead: () => Promise<void>;
}

/**
 * API response with `messages` replaced by instantiated SDK `Message` classes.
 */
type MessageHistorySearchResult = Omit<
	MessageHistorySearchRawResponse,
	'items'
> & {
	items: IMessage[];
};

type MessageSendFileParams = Omit<
	WebitelImApiGatewayV1SendDocumentRequest,
	'document'
> & {
	document?: NonNullable<WebitelImApiGatewayV1SendDocumentRequest['document']>;
	file: File;
	threadId: string;
};

type MessageSendImageParams = Omit<
	WebitelImApiGatewayV1SendImageRequest,
	'image'
> & {
	image?: NonNullable<WebitelImApiGatewayV1SendImageRequest['image']>;
	file: File;
	threadId: string;
};

export type {
	IMessage,
	MessageHistorySearchParams,
	MessageHistorySearchRawResponse,
	MessageHistorySearchResult,
	MessageModel,
	MessageSendFileParams,
	MessageSendFileRawResponse,
	MessageSendImageParams,
	MessageSendImageRawResponse,
	MessageSendTextParams,
	MessageSendTextRawResponse,
	MessageUploadFileRawResponse,
};
