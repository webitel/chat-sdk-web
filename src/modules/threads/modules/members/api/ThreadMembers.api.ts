import {
	applyTransform,
	snakeToCamel,
} from '@webitel/api-services/api/transformers';

import type { ServiceConfig } from '../../../../configs';
import type {
	ThreadAddMemberParams,
	ThreadAddMemberResponse,
	ThreadRemoveMemberParams,
	ThreadRemoveMemberResponse,
} from '../types/ThreadMember.types';

interface IThreadMembersApiService {
	addMember: (
		threadId: string,
		params: ThreadAddMemberParams,
	) => Promise<ThreadAddMemberResponse>;
	removeMember: (
		threadId: string,
		params: ThreadRemoveMemberParams,
	) => Promise<ThreadRemoveMemberResponse>;
}

export const getThreadMembersService = ({
	axiosInstance,
}: ServiceConfig): IThreadMembersApiService => ({
	/**
	 * `POST /v1/threads/{threadId}/members`
	 *
	 * Flattens `{ contact: { sub, iss }, role }` into the payload shape
	 * expected by the gateway.
	 */
	addMember: async (
		threadId: string,
		{ contact, role }: ThreadAddMemberParams,
	): Promise<ThreadAddMemberResponse> => {
		const response = await axiosInstance.post(
			`/v1/threads/${threadId}/members`,
			{
				contact: {
					sub: contact.sub,
					iss: contact.iss,
				},
				role,
			},
		);
		return applyTransform(response.data, [
			snakeToCamel(),
		]);
	},

	/**
	 * `DELETE /v1/threads/{threadId}/members/{memberId}`
	 *
	 * Identifies the member to remove via the `memberId` path segment.
	 */
	removeMember: async (
		threadId: string,
		{ id: memberId }: ThreadRemoveMemberParams,
	): Promise<ThreadRemoveMemberResponse> => {
		const response = await axiosInstance.delete(
			`/v1/threads/${threadId}/members/${memberId}`,
		);
		return applyTransform(response.data, [
			snakeToCamel(),
		]);
	},
});
