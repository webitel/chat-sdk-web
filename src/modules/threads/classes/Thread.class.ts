import type { ServiceConfig } from '../../configs';
import type { ThreadModel, IThread } from '../types/Thread.types';
import { useMessagesService, type MessageHistorySearchParams } from '../../messages';

class Thread implements IThread {
    id!: string;
    serviceConfig: ServiceConfig;

    constructor(rawThread: ThreadModel, { serviceConfig }: { serviceConfig: ServiceConfig }) {
        Object.assign(this, rawThread);
        this.serviceConfig = serviceConfig;
    }

    async fetchMessageHistory(
        params?: MessageHistorySearchParams,
    ) {
        return useMessagesService(this.serviceConfig).fetchMessageHistory(this.id, params);
    }
}

export function createThread(rawThread: ThreadModel, { serviceConfig }: { serviceConfig: ServiceConfig }): Thread {
    return new Thread(rawThread, { serviceConfig });
}
 