import type { ServiceConfig } from '../../configs';
import { getThreadsService } from '../api/Threads.api';
import { createThread } from '../classes/Thread.class';
import type {
	IThread,
	ThreadModel,
	ThreadSearchParams,
	ThreadSearchRawResult,
	ThreadSearchResult,
} from '../types/Thread.types';

/**
 * Raw threads from `GET /v1/threads` (`WebitelImApiGatewayV1SearchThreadResponse.threads`).
 */
const fetchRawThreads =
	(config: ServiceConfig) =>
	async (params: ThreadSearchParams = {}): Promise<ThreadSearchRawResult> => {
		const response = await getThreadsService(config).getThreadsList(params);
		return response;
	};

const instantiateThreads = (
	rawThreads: ThreadModel[],
	{
		serviceConfig,
	}: {
		serviceConfig: ServiceConfig;
	},
): IThread[] => {
	return rawThreads.map((rawThread) =>
		createThread(rawThread, {
			serviceConfig,
		}),
	);
};

/**
 * Fetches threads and returns `Thread` class instances.
 * Requires `ServiceConfig` (same pattern as `fetchContacts`).
 */
const fetchThreads = async (
	config: ServiceConfig,
	params: ThreadSearchParams = {},
): Promise<ThreadSearchResult> => {
	const rawThreadsResponse = await fetchRawThreads(config)(params);
	return {
		...rawThreadsResponse,
		threads: instantiateThreads(rawThreadsResponse.threads ?? [], {
			serviceConfig: config,
		}),
	};
};

export { fetchRawThreads, fetchThreads };
