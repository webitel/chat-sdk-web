import type {
	WebitelImApiGatewayV1Thread as ThreadModel,
	ThreadManagementSearchParams as ThreadSearchParams,
	WebitelImApiGatewayV1SearchThreadResponse as ThreadSearchRawResult,
} from '@webitel/api-services/gen/models';

import type { ServiceConfigurable } from '../../configs';
import type {
	MessageHistorySearchParams,
	MessageHistorySearchResult,
	MessageSendDocumentRawResponse,
	MessageSendImageRawResponse,
	MessageSendTextRawResponse,
} from '../../messages/types/Message.types';

/**
 * Unified thread send-message params.
 *
 * - text-only message: pass `body`
 * - document message (optionally with caption): pass `documents` + optional `body`
 * - image message (optionally with caption): pass `images` + optional `body`
 *
 * `images` take precedence over `documents` when both are provided.
 */
interface ThreadSendMessageParams {
	body?: string;
	documents?: File | readonly File[];
	images?: File | readonly File[];
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
