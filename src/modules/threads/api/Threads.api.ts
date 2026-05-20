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

interface IThreadsApiService {
	getThreadsList: (
		params?: ThreadSearchParams,
	) => Promise<ThreadSearchRawResult>;
	getThread: (threadId: string) => Promise<ThreadModel>;
}

export const getThreadsService = ({
	axiosInstance,
}: ServiceConfig): IThreadsApiService => ({
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
			snakeToCamel([
				'variables',
			]),
		]);
	},

	getThread: async (threadId: string): Promise<ThreadModel> => {
		const response = await axiosInstance.get(`/v1/threads/${threadId}`);
		return applyTransform(response.data, [
			snakeToCamel([
				'variables',
			]),
		]);
	},
});
