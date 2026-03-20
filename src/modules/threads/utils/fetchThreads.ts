import type { ThreadManagementSearchParams } from '@webitel/api-services/gen/models';

import type { ServiceConfig } from '../../configs';
import { getThreadsService } from '../api/Threads.api';
import { createThread } from '../classes/Thread.class';
import type { ThreadModel } from '../types/Thread.types';

/**
 * Raw threads from `GET /v1/threads` (`WebitelImApiGatewayV1SearchThreadResponse.threads`).
 */
const fetchRawThreads = (config: ServiceConfig) => async (params: ThreadManagementSearchParams = {}) => {
    const response = await getThreadsService(config).getThreadsList(params);
    return response;
};

const instantiateThreads = (rawThreads: ThreadModel[]) => {
    return rawThreads.map((rawThread) => createThread(rawThread));
};

/**
 * Fetches threads and returns `Thread` class instances.
 * Requires `ServiceConfig` (same pattern as `fetchContacts`).
 */
const fetchThreads = async (config: ServiceConfig, params: ThreadManagementSearchParams = {}) => {
    const rawThreadsResponse = await fetchRawThreads(config)(params);
    return {
        ...rawThreadsResponse,
        threads: instantiateThreads(rawThreadsResponse.threads ?? []),
    };
};

export {
    fetchRawThreads,
    fetchThreads,
};
