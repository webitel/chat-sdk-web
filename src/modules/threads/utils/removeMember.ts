import type { ServiceConfig } from '../../configs';
import { getThreadsService } from '../api/Threads.api';
import type {
	ThreadRemoveMemberParams,
	ThreadRemoveMemberResponse,
} from '../types/Thread.types';

/**
 * Raw `DELETE /v1/threads/{threadId}/members`
 */
const removeMember =
	(config: ServiceConfig) =>
	async (
		threadId: string,
		params: ThreadRemoveMemberParams,
	): Promise<ThreadRemoveMemberResponse> => {
		const response = await getThreadsService(config).removeMember(
			threadId,
			params,
		);
		return response;
	};

export { removeMember };
