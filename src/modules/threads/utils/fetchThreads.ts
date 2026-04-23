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
 * Raw threads from `GET /v1/threads`
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
		items: instantiateThreads(
			(rawThreadsResponse.items ?? []) as ThreadModel[],
			{
				serviceConfig: config,
			},
		),
	};
};

const getRawThread =
	(config: ServiceConfig) =>
	async (
		threadId: string,
	): Promise<NonNullable<ThreadSearchRawResult['items']>[number]> => {
		return getThreadsService(config).getThread(threadId);
	};

const fetchThread = async (
	config: ServiceConfig,
	threadId: string,
): Promise<IThread> => {
	const rawThread = await getRawThread(config)(threadId);
	return createThread(rawThread as ThreadModel, {
		serviceConfig: config,
	});
};

export { fetchThread, fetchThreads };
