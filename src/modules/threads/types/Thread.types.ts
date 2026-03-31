import type {
	WebitelImApiGatewayV1Thread as ThreadModel,
	ThreadManagementSearchParams as ThreadSearchParams,
	WebitelImApiGatewayV1SearchThreadResponse as ThreadSearchRawResult,
} from '@webitel/api-services/gen/models';

import type { ServiceConfigurable } from '../../configs';
import type {
	MessageHistorySearchParams,
	MessageHistorySearchResult,
	MessageSendFileParams,
	MessageSendFileRawResponse,
	MessageSendImageParams,
	MessageSendImageRawResponse,
	MessageSendTextParams,
	MessageSendTextRawResponse,
} from '../../messages/types/Message.types';

type ThreadSendTextMessageParams = Omit<MessageSendTextParams, 'body' | 'to'>;
type ThreadSendFileMessageParams = Omit<
	MessageSendFileParams,
	'file' | 'threadId' | 'to'
>;
type ThreadSendImageMessageParams = Omit<
	MessageSendImageParams,
	'file' | 'threadId' | 'to'
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

	sendFileMessage: (
		file: File,
		params?: ThreadSendFileMessageParams,
	) => Promise<MessageSendFileRawResponse>;

	sendImageMessage: (
		file: File,
		params?: ThreadSendImageMessageParams,
	) => Promise<MessageSendImageRawResponse>;
}

type ThreadSearchResult = Omit<ThreadSearchRawResult, 'threads'> & {
	threads: IThread[];
};

export type {
	IThread,
	ThreadModel,
	ThreadSearchParams,
	ThreadSearchRawResult,
	ThreadSearchResult,
	ThreadSendFileMessageParams,
	ThreadSendImageMessageParams,
	ThreadSendTextMessageParams,
};
