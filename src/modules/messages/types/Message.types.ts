import type {
	MessageHistorySearchThreadMessagesHistoryWebitelImApiGatewayV1MessageHistoryParams as MessageHistorySearchParams,
	WebitelImApiGatewayV1SearchMessageHistoryResponse as MessageHistorySearchRawResponse,
	WebitelImApiGatewayV1HistoryMessage as MessageModel,
	WebitelImApiGatewayV1SendDocumentResponse as MessageSendDocumentRawResponse,
	WebitelImApiGatewayV1SendDocumentRequest as MessageSendDocumentRequest,
	WebitelImApiGatewayV1SendImageResponse as MessageSendImageRawResponse,
	WebitelImApiGatewayV1SendImageRequest as MessageSendImageRequest,
	WebitelImApiGatewayV1SendTextRequest as MessageSendTextParams,
	WebitelImApiGatewayV1SendTextResponse as MessageSendTextRawResponse,
} from '@webitel/api-services/gen/models';

import type { ServiceConfigurable } from '../../configs';

/**
 * One element from storage upload `POST …/upload` response
 */
interface MessageStorageUploadedFile {
	id: number;
	name: string;
	size: number;
	mime: string;
	/** Signed download path / URL */
	shared: string;
}

/**
 * Represents chat-web-sdk message interface: `MessageModel` + Message methods
 * @extends MessageModel
 */
interface IMessage extends MessageModel, ServiceConfigurable {
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

/**
 * `sendDocument` message wrapper method params.
 * Wraps both uploading files to storage and sending document message.
 */
type MessageSendDocumentParams = Omit<MessageSendDocumentRequest, 'document'> &
	Pick<Required<MessageSendDocumentRequest>, 'to'> & {
		files: File | readonly File[];
	};

/**
 * `sendImage` message wrapper method params.
 * Wraps both uploading files to storage and sending image message.
 */
type MessageSendImageParams = Omit<MessageSendImageRequest, 'image'> &
	Pick<Required<MessageSendImageRequest>, 'to'> & {
		files: File | readonly File[];
	};

export type {
	IMessage,
	MessageHistorySearchParams,
	MessageHistorySearchRawResponse,
	MessageHistorySearchResult,
	MessageModel,
	MessageSendDocumentParams,
	MessageSendDocumentRawResponse,
	MessageSendDocumentRequest,
	MessageSendImageParams,
	MessageSendImageRawResponse,
	MessageSendImageRequest,
	MessageSendTextParams,
	MessageSendTextRawResponse,
	MessageStorageUploadedFile,
};
