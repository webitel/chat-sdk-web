import type {
    MessageHistorySearchThreadMessagesHistoryWebitelImApiGatewayV1MessageHistoryParams,
} from '@webitel/api-services/gen/models';

import type { ServiceConfig } from '../configs';
import { fetchMessageHistory } from './utils/fetchMessageHistory';

export function useMessagesService(config: ServiceConfig) {
    return {
        fetchMessageHistory: (
            threadId: string,
            params?: MessageHistorySearchThreadMessagesHistoryWebitelImApiGatewayV1MessageHistoryParams,
        ) => fetchMessageHistory(config, threadId, params ?? {}),
    };
}
