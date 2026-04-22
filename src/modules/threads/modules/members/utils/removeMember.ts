import type { ServiceConfig } from '../../../../configs';
import { getThreadMembersService } from '../api/ThreadMembers.api';
import type {
	ThreadRemoveMemberParams,
	ThreadRemoveMemberResponse,
} from '../types/ThreadMember.types';

/** Raw `DELETE /v1/threads/{threadId}/members/{memberId}` */
const removeMember =
	(config: ServiceConfig) =>
	async (
		threadId: string,
		params: ThreadRemoveMemberParams,
	): Promise<ThreadRemoveMemberResponse> =>
		getThreadMembersService(config).removeMember(threadId, params);

export { removeMember };
