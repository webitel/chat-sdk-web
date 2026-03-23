import type { ServiceConfig } from '../../configs';
import type { ThreadModel, IThread } from '../types/Thread.types';
import { useMessagesService, type MessageHistorySearchParams } from '../../messages';

class Thread implements IThread {
    private readonly _serviceConfig: ServiceConfig;
    id!: string;

    constructor(rawThread: ThreadModel, { serviceConfig }: { serviceConfig: ServiceConfig }) {
        Object.assign(this, rawThread);
        this._serviceConfig = serviceConfig;
    }

    async fetchMessageHistory(
        params?: MessageHistorySearchParams,
    ) {
        return useMessagesService(this.serviceConfig).fetchMessageHistory(this.id, params);
    }

    get serviceConfig(): ServiceConfig {
        return this._serviceConfig;
    }
}

export function createThread(rawThread: ThreadModel, { serviceConfig }: { serviceConfig: ServiceConfig }): IThread {
    return new Thread(rawThread, { serviceConfig });
}
 