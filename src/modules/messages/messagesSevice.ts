import type { ServiceConfig } from '../configs';
import { fetchMessageHistory } from './utils/fetchMessageHistory';

export function useMessagesService(config: ServiceConfig) {
    return {
        fetchMessageHistory: (threadId: string) => fetchMessageHistory(config, threadId),
    };
}
