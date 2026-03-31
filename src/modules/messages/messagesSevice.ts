import type { ServiceConfig } from '../configs';
import type {
	MessageHistorySearchParams,
	MessageSendFileParams,
	MessageSendImageParams,
	MessageSendTextParams,
} from './types/Message.types';
import { fetchMessageHistory } from './utils/fetchMessageHistory';
import { sendFileMessage } from './utils/sendFileMessage';
import { sendImageMessage } from './utils/sendImageMessage';
import { sendTextMessage } from './utils/sendTextMessage';

export function useMessagesService(config: ServiceConfig) {
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
