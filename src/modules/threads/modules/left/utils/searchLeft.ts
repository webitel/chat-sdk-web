import type { ServiceConfig } from '../../../../configs';
import type { ThreadModel } from '../../../types/Thread.types';
import { getLeftThreadsService } from '../api/LeftThreads.api';
import { createLeftThread } from '../classes/LeftThread.class';
import type {
	LeftThreadSearchParams,
	LeftThreadSearchResult,
} from '../types/LeftThread.types';

/**
 * Fetches a page of the threads the caller has left and returns `LeftThread`
 * class instances.
 */
const searchLeft =
	(config: ServiceConfig) =>
	async (
		params: LeftThreadSearchParams = {},
	): Promise<LeftThreadSearchResult> => {
		const rawResponse =
			await getLeftThreadsService(config).getLeftThreadsList(params);
		return {
			items: ((rawResponse.items ?? []) as ThreadModel[]).map((rawThread) =>
				createLeftThread(rawThread, {
					serviceConfig: config,
				}),
			),
			next: rawResponse.next ?? false,
		};
	};

export { searchLeft };
