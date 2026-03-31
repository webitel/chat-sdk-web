import type { ServiceConfig } from '../configs';
import type {
	MessageHistorySearchParams,
	MessageHistorySearchResult,
	MessageSendFileParams,
	MessageSendFileRawResponse,
	MessageSendImageParams,
	MessageSendImageRawResponse,
	MessageSendTextParams,
	MessageSendTextRawResponse,
} from './types/Message.types';
import { fetchMessageHistory } from './utils/fetchMessageHistory';
import { sendFileMessage } from './utils/sendFileMessage';
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
	sendFileMessage: (
		params: MessageSendFileParams,
	) => Promise<MessageSendFileRawResponse>;
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
		sendFileMessage: (params: MessageSendFileParams) =>
			sendFileMessage(config, params),
		sendImageMessage: (params: MessageSendImageParams) =>
			sendImageMessage(config, params),
	};
}
