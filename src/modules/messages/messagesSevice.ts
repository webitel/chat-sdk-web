import type { ServiceConfig } from '../configs';
import type { MessageHistorySearchParams } from './types/Message.types';
import { fetchMessageHistory } from './utils/fetchMessageHistory';

export function useMessagesService(config: ServiceConfig) {
	return {
		fetchMessageHistory: (
			threadId: string,
			params?: MessageHistorySearchParams,
		) => fetchMessageHistory(config, threadId, params ?? {}),
	};
}
