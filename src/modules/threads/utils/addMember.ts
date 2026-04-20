import type { ServiceConfig } from '../../configs';
import { getThreadsService } from '../api/Threads.api';
import type {
	ThreadAddMemberParams,
	ThreadAddMemberResponse,
} from '../types/Thread.types';

/**
 * Raw `POST /v1/threads/{threadId}/members`
 */
const addMember =
	(config: ServiceConfig) =>
	async (
		threadId: string,
		params: ThreadAddMemberParams,
	): Promise<ThreadAddMemberResponse> => {
		const response = await getThreadsService(config).addMember(
			threadId,
			params,
		);
		return response;
	};

export { addMember };
