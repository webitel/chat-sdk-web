import type { ServiceConfig } from '../../configs';
import { fetchMessageHistory } from '../../messages';
import type { ThreadModel, IThread } from '../types/Thread.types';

class Thread implements IThread {
    constructor(rawThread: ThreadModel) {
        Object.assign(this, rawThread);
    }

    async fetchMessageHistory(config: ServiceConfig) {
        if (!this.id) {
            throw new Error('Thread id is required to fetch message history');
        }
        return fetchMessageHistory(config, this.id);
    }
}

export function createThread(rawThread: ThreadModel): Thread {
    return new Thread(rawThread);
}
