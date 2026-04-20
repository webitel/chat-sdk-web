import type {
	WebitelImApiGatewayV1Thread as ThreadModel,
	ThreadManagementSearchParams as ThreadSearchParams,
	WebitelImApiGatewayV1SearchThreadResponse as ThreadSearchRawResult,
} from '@webitel/api-services/gen/models';

import type { ServiceConfigurable } from '../../configs';
import type {
	MessageHistorySearchParams,
	MessageHistorySearchResult,
	MessageSendAttachments,
	MessageSendDocumentRawResponse,
	MessageSendImageRawResponse,
	MessageSendTextRawResponse,
} from '../../messages/types/Message.types';

/**
 * Unified thread send-message params.
 *
 * A message carries an optional text `body` and at most one
 * `attachments` payload (tagged by `type`). Text-only messages omit
 * `attachments`.
 */
interface ThreadSendMessageParams {
	body?: string;
	attachments?: MessageSendAttachments;
}

interface ThreadSendMessageOptions {
	sendId?: string;
}

type ThreadSendMessageResponse =
	| MessageSendTextRawResponse
	| MessageSendDocumentRawResponse
	| MessageSendImageRawResponse;

interface IThread extends ThreadModel, ServiceConfigurable {
	id: string;

	fetchMessageHistory: (
		params?: MessageHistorySearchParams,
	) => Promise<MessageHistorySearchResult>;

	sendMessage: (
		params: ThreadSendMessageParams,
		options?: ThreadSendMessageOptions,
	) => Promise<ThreadSendMessageResponse>;
}

type ThreadSearchResult = Omit<ThreadSearchRawResult, 'items'> & {
	items: IThread[];
};

export type {
	IThread,
	ThreadModel,
	ThreadSearchParams,
	ThreadSearchRawResult,
	ThreadSearchResult,
	ThreadSendMessageOptions,
	ThreadSendMessageParams,
	ThreadSendMessageResponse,
};
