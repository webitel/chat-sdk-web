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
import type { MessageAttachmentType } from '../enums/MessageAttachmentType.enum';

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
 * Tagged union describing a single attachment payload attached to a message.
 *
 * A message carries **at most one** attachment kind alongside its optional
 * text `body`. The union is intentionally open-ended so future kinds
 * (location, interactive, sticker, …) can be added without reshaping
 * `sendMessage` call-sites.
 */
type MessageSendAttachments =
	| {
			type: typeof MessageAttachmentType.Documents;
			files: File | readonly File[];
	  }
	| {
			type: typeof MessageAttachmentType.Images;
			files: File | readonly File[];
	  };

/**
 * `sendDocument` message wrapper method params.
 * Wraps both uploading files to storage and sending document message.
 *
 * `body` is an optional caption attached to the document message
 * (forwarded to `document.body` in the underlying request).
 */
type MessageSendDocumentParams = Omit<MessageSendDocumentRequest, 'document'> &
	Pick<Required<MessageSendDocumentRequest>, 'to'> & {
		files: File | readonly File[];
		body?: string;
	};

/**
 * `sendImage` message wrapper method params.
 * Wraps both uploading files to storage and sending image message.
 *
 * `body` is an optional caption attached to the image message
 * (forwarded to `image.body` in the underlying request).
 */
type MessageSendImageParams = Omit<MessageSendImageRequest, 'image'> &
	Pick<Required<MessageSendImageRequest>, 'to'> & {
		files: File | readonly File[];
		body?: string;
	};

/**
 * Unified `sendMessage` params shared by every peer type (threads,
 * contacts, …).
 *
 * A message carries an optional text `body` and at most one `attachments`
 * payload (tagged by `type`). Text-only messages omit `attachments`.
 */
interface MessageSendParams {
	body?: string;
	attachments?: MessageSendAttachments;
}

/**
 * Transport-level options for `sendMessage` that are independent of the
 * message payload itself.
 */
interface MessageSendOptions {
	sendId?: string;
}

/**
 * Union of every possible raw response returned by `sendMessage`,
 * depending on which concrete send-* endpoint was dispatched.
 */
type MessageSendResponse =
	| MessageSendTextRawResponse
	| MessageSendDocumentRawResponse
	| MessageSendImageRawResponse;

/**
 * Contract implemented by any peer that can be used as the "to" target of
 * a message (currently `IThread` and `IContact`). Keeping a single shape
 * lets call-sites work polymorphically with either peer.
 */
interface IMessageSender {
	sendMessage: (
		params: MessageSendParams,
		options?: MessageSendOptions,
	) => Promise<MessageSendResponse>;
}

export type {
	IMessage,
	IMessageSender,
	MessageHistorySearchParams,
	MessageHistorySearchRawResponse,
	MessageHistorySearchResult,
	MessageModel,
	MessageSendAttachments,
	MessageSendDocumentParams,
	MessageSendDocumentRawResponse,
	MessageSendDocumentRequest,
	MessageSendImageParams,
	MessageSendImageRawResponse,
	MessageSendImageRequest,
	MessageSendOptions,
	MessageSendParams,
	MessageSendResponse,
	MessageSendTextParams,
	MessageSendTextRawResponse,
	MessageStorageUploadedFile,
};
