import type {
    MessageHistorySearchThreadMessagesHistoryWebitelImApiGatewayV1MessageHistoryParams,
} from '@webitel/api-services/gen/models';

import type { ServiceConfig } from '../../configs';
import { fetchMessageHistory } from '../../messages';
import type { ThreadModel, IThread } from '../types/Thread.types';

class Thread implements IThread {
    id?: string;

    constructor(rawThread: ThreadModel) {
        Object.assign(this, rawThread);
    }

    async fetchMessageHistory(
        config: ServiceConfig,
        params?: MessageHistorySearchThreadMessagesHistoryWebitelImApiGatewayV1MessageHistoryParams,
    ) {
        if (!this.id) {
            throw new Error('Thread id is required to fetch message history');
        }
        return fetchMessageHistory(config, this.id, params);
    }
}

export function createThread(rawThread: ThreadModel): Thread {
    return new Thread(rawThread);
}
