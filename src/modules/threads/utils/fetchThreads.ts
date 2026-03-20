import type { ServiceConfig } from '../../configs';
import { getThreadsList } from '../api/Threads.api';
import { createThread } from '../classes/Thread.class';
import type { ThreadModel } from '../types/Thread.types';

/**
 * Raw threads from `GET /v1/threads` (`WebitelImApiGatewayV1SearchThreadResponse.threads`).
 */
const fetchRawThreads = async (config: ServiceConfig) => {
    const response = await getThreadsList(config);
    return response.threads ?? [];
};

const instantiateThreads = (rawThreads: ThreadModel[]) => {
    return rawThreads.map((rawThread) => createThread(rawThread));
};

/**
 * Fetches threads and returns `Thread` class instances.
 * Requires `ServiceConfig` (same pattern as `fetchContacts`).
 */
const fetchThreads = async (config: ServiceConfig) => {
    const rawThreads = await fetchRawThreads(config);
    return instantiateThreads(rawThreads);
};

export {
    fetchRawThreads,
    fetchThreads,
};
