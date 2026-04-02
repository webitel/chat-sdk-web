import type { ServiceConfig } from '../configs';
import type {
	MessageHistorySearchParams,
	MessageHistorySearchResult,
	MessageSendDocumentParams,
	MessageSendDocumentRawResponse,
	MessageSendImageParams,
	MessageSendImageRawResponse,
	MessageSendTextParams,
	MessageSendTextRawResponse,
} from './types/Message.types';
import { fetchMessageHistory } from './utils/fetchMessageHistory';
import { sendDocumentMessage } from './utils/sendDocumentMessage';
import { sendImageMessage } from './utils/sendImageMessage';
import { sendTextMessage } from './utils/sendTextMessage';

interface IMessagesService {
	fetchMessageHistory: (
		threadId: string,
		params?: MessageHistorySearchParams,
	) => Promise<MessageHistorySearchResult>;
	sendTextMessage: (
		params: MessageSendTextParams,
	) => Promise<MessageSendTextRawResponse>;
	sendDocumentMessage: (
		params: MessageSendDocumentParams,
	) => Promise<MessageSendDocumentRawResponse>;
	sendImageMessage: (
		params: MessageSendImageParams,
	) => Promise<MessageSendImageRawResponse>;
}

export function useMessagesService(config: ServiceConfig): IMessagesService {
	return {
		fetchMessageHistory: (
			threadId: string,
			params?: MessageHistorySearchParams,
		) => fetchMessageHistory(config, threadId, params ?? {}),
		sendTextMessage: (params: MessageSendTextParams) =>
			sendTextMessage(config, params),
		sendDocumentMessage: (params: MessageSendDocumentParams) =>
			sendDocumentMessage(config, params),
		sendImageMessage: (params: MessageSendImageParams) =>
			sendImageMessage(config, params),
	};
}
