import type { ThreadModel, IThread } from '../types/Thread.types';
import { fetchMessageHistory } from '../../messages';

class Thread implements IThread {
    constructor(rawThread: ThreadModel) {
        Object.assign(this, rawThread);
    }

    async fetchMessageHistory() {
        return fetchMessageHistory(this.id);
    }
}

export function createThread(rawThread: ThreadModel): Thread {
    return new Thread(rawThread);
}