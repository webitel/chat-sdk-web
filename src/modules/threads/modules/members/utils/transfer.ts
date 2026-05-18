import type { ServiceConfig } from '../../../../configs';
import { getThreadMembersService } from '../api/ThreadMembers.api';
import type {
	ThreadTransferParams,
	ThreadTransferResponse,
} from '../types/ThreadMember.types';

/** Raw `POST /v1/threads/{threadId}/transfer` */
const transfer =
	(config: ServiceConfig) =>
	async (
		threadId: string,
		params: ThreadTransferParams,
	): Promise<ThreadTransferResponse> =>
		getThreadMembersService(config).transfer(threadId, params);

export { transfer };
