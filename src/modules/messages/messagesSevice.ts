import type { ServiceConfig } from '../configs';
import { fetchMessageHistory } from './utils/fetchMessageHistory';
import type { MessageHistorySearchParams } from './types/Message.types';

export function useMessagesService(config: ServiceConfig) {
    return {
        fetchMessageHistory: (
            threadId: string,
            params?: MessageHistorySearchParams,
        ) => fetchMessageHistory(config, threadId, params ?? {}),
    };
}
