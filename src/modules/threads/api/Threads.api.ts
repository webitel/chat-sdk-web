import {
	applyTransform,
	camelToSnake,
	snakeToCamel,
} from '@webitel/api-services/api/transformers';

import type { ServiceConfig } from '../../configs';
import type {
	ThreadAddMemberParams,
	ThreadAddMemberResponse,
	ThreadRemoveMemberParams,
	ThreadRemoveMemberResponse,
	ThreadSearchParams,
	ThreadSearchRawResult,
} from '../types/Thread.types';

export const getThreadsService = ({ axiosInstance }: ServiceConfig) => {
	return {
		getThreadsList: async (
			params: ThreadSearchParams = {},
		): Promise<ThreadSearchRawResult> => {
			const transformedParams = applyTransform(params, [
				camelToSnake(),
			]);

			const response = await axiosInstance.get('/v1/threads', {
				params: transformedParams,
			});
			return applyTransform(response.data, [
				snakeToCamel(),
			]);
		},

		/**
		 * `POST /v1/threads/{threadId}/members`
		 *
		 * Flattens `{ contact: { sub, iss }, role }` into the query-string
		 * shape expected by the gateway (`contact_sub`, `contact_iss`,
		 * `role`).
		 */
		addMember: async (
			threadId: string,
			{ contact, role }: ThreadAddMemberParams,
		): Promise<ThreadAddMemberResponse> => {
			const response = await axiosInstance.post(
				`/v1/threads/${threadId}/members`,
				{},
				{
					params: {
						member: {
							sub: contact.sub,
							iss: contact.iss,
						},
						role,
					},
				},
			);
			return applyTransform(response.data, [
				snakeToCamel(),
			]);
		},

		/**
		 * `DELETE /v1/threads/{threadId}/members`
		 *
		 * Identifies the member to remove via `contact_sub` / `contact_iss`
		 * query params (no memberId path segment).
		 */
		removeMember: async (
			threadId: string,
			{ contact }: ThreadRemoveMemberParams,
		): Promise<ThreadRemoveMemberResponse> => {
			const response = await axiosInstance.delete(
				`/v1/threads/${threadId}/members`,
				{
					params: applyTransform(
						{
							contactSub: contact.sub,
							contactIss: contact.iss,
						},
						[
							camelToSnake(),
						],
					),
				},
			);
			return applyTransform(response.data, [
				snakeToCamel(),
			]);
		},
	};
};
