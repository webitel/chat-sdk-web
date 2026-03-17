import { getList } from '../api/Threads.api';
import { createThread } from '../classes/Thread.class';
import { ThreadModel } from '../types/Thread.types';

/**
 * no class instantiation, only raw data
 */
const fetchRawThreads = () => {
    return getList();
}

const instantiateThreads = (rawThreads: ThreadModel[]) => {
    return rawThreads.map((rawThread) => createThread(rawThread));
};

const fetchThreads = async () => {
    const rawThreads = await fetchRawThreads();
    return instantiateThreads(rawThreads);
};

export {
    fetchRawThreads,
    fetchThreads,
};