import type { ServiceConfig } from '../../../../configs';
import { getThreadMembersService } from '../api/ThreadMembers.api';
import type {
	ThreadAddMemberParams,
	ThreadAddMemberResponse,
} from '../types/ThreadMember.types';

/** Raw `POST /v1/threads/{threadId}/members` */
const addMember =
	(config: ServiceConfig) =>
	async (
		threadId: string,
		params: ThreadAddMemberParams,
	): Promise<ThreadAddMemberResponse> =>
		getThreadMembersService(config).addMember(threadId, params);

export { addMember };
