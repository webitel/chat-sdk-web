import type { ServiceConfig } from '../configs';
import type {
	MessageHistorySearchParams,
	MessageSendTextParams,
} from './types/Message.types';
import { fetchMessageHistory } from './utils/fetchMessageHistory';
import { sendTextMessage } from './utils/sendTextMessage';

export function useMessagesService(config: ServiceConfig) {
	return {
		fetchMessageHistory: (
			threadId: string,
			params?: MessageHistorySearchParams,
		) => fetchMessageHistory(config, threadId, params ?? {}),
		sendTextMessage: (params: MessageSendTextParams) =>
			sendTextMessage(config, params),
	};
}
