import type {
	MessageHistorySearchThreadMessagesHistoryWebitelImApiGatewayV1MessageHistoryParams as MessageHistorySearchParams,
	WebitelImApiGatewayV1SearchMessageHistoryResponse as MessageHistorySearchRawResponse,
	WebitelImApiGatewayV1HistoryMessage as MessageModel,
	WebitelImApiGatewayV1SendDocumentResponse as MessageSendDocumentRawResponse,
	WebitelImApiGatewayV1SendImageResponse as MessageSendImageRawResponse,
	WebitelImApiGatewayV1SendTextRequest as MessageSendTextParams,
	WebitelImApiGatewayV1SendTextResponse as MessageSendTextRawResponse,
	WebitelImApiGatewayV1SendDocumentRequest,
	WebitelImApiGatewayV1SendImageRequest,
} from '@webitel/api-services/gen/models';

/**
 * One element from storage upload `POST …/upload` body: `[{ id, name, size, mime, shared }]`.
 */
interface MessageStorageUploadedFile {
	id: number;
	name: string;
	size: number;
	mime: string;
	/** Signed download path / URL */
	shared: string;
}

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

type MessageSendDocumentParams = Omit<
	WebitelImApiGatewayV1SendDocumentRequest,
	'document'
> & {
	document?: NonNullable<WebitelImApiGatewayV1SendDocumentRequest['document']>;
	files: readonly File[];
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
	MessageSendDocumentParams,
	MessageSendDocumentRawResponse,
	MessageSendImageParams,
	MessageSendImageRawResponse,
	MessageSendTextParams,
	MessageSendTextRawResponse,
	MessageStorageUploadedFile,
};
