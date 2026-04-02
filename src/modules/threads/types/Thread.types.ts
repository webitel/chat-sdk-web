import type {
	WebitelImApiGatewayV1Thread as ThreadModel,
	ThreadManagementSearchParams as ThreadSearchParams,
	WebitelImApiGatewayV1SearchThreadResponse as ThreadSearchRawResult,
} from '@webitel/api-services/gen/models';

import type { ServiceConfigurable } from '../../configs';
import type {
	MessageHistorySearchParams,
	MessageHistorySearchResult,
	MessageSendDocumentParams,
	MessageSendDocumentRawResponse,
	MessageSendImageParams,
	MessageSendImageRawResponse,
	MessageSendTextParams,
	MessageSendTextRawResponse,
} from '../../messages/types/Message.types';

type ThreadSendTextMessageParams = Omit<MessageSendTextParams, 'body' | 'to'>;
type ThreadSendDocumentMessageParams = Omit<
	MessageSendDocumentParams,
	'files' | 'threadId' | 'to'
>;
type ThreadSendImageMessageParams = Omit<
	MessageSendImageParams,
	'files' | 'threadId' | 'to'
>;

interface IThread extends ThreadModel, ServiceConfigurable {
	id: string;

	fetchMessageHistory: (
		params?: MessageHistorySearchParams,
	) => Promise<MessageHistorySearchResult>;

	sendTextMessage: (
		body: string,
		params?: ThreadSendTextMessageParams,
	) => Promise<MessageSendTextRawResponse>;

	sendDocumentMessage: (
		files: File | readonly File[],
		params?: ThreadSendDocumentMessageParams,
	) => Promise<MessageSendDocumentRawResponse>;

	sendImageMessage: (
		files: File | readonly File[],
		params?: ThreadSendImageMessageParams,
	) => Promise<MessageSendImageRawResponse>;
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
	ThreadSendDocumentMessageParams,
	ThreadSendImageMessageParams,
	ThreadSendTextMessageParams,
};
