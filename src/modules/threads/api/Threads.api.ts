import {
	applyTransform,
	camelToSnake,
	snakeToCamel,
} from '@webitel/api-services/api/transformers';

import type { ServiceConfig } from '../../configs';
import type {
	ThreadModel,
	ThreadSearchParams,
	ThreadSearchRawResult,
} from '../types/Thread.types';

export const getThreadsService = ({ axiosInstance }: ServiceConfig) => ({
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

	// Temporary: uses getThreadsList with ids filter until dedicated GET /v1/threads/:id endpoint exists
	getThread: async (
		threadId: string,
	): Promise<NonNullable<ThreadSearchRawResult['items']>[number]> => {
		const transformedParams = applyTransform(
			{
				ids: [
					threadId,
				],
			},
			[
				camelToSnake(),
			],
		);

		const response = await axiosInstance.get('/v1/threads', {
			params: transformedParams,
		});
		const result: ThreadSearchRawResult = applyTransform(response.data, [
			snakeToCamel(),
		]);
		const thread = result.items?.[0];
		if (!thread) throw new Error(`Thread not found: ${threadId}`);
		return thread as ThreadModel;
	},
});
