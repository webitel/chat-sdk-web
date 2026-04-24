import {
	applyTransform,
	snakeToCamel,
} from '@webitel/api-services/api/transformers';

import type { ServiceConfig } from '../../../../configs';
import type {
	ThreadFlushVariablesParams,
	ThreadSetVariablesParams,
	ThreadVariablesResponse,
} from '../types/ThreadVariable.types';

interface IThreadVariablesApiService {
	locateVariables: (threadId: string) => Promise<ThreadVariablesResponse>;
	setVariables: (
		threadId: string,
		params: ThreadSetVariablesParams,
	) => Promise<ThreadVariablesResponse>;
	flushVariables: (
		threadId: string,
		params: ThreadFlushVariablesParams,
	) => Promise<ThreadVariablesResponse>;
}

export const getThreadVariablesService = ({
	axiosInstance,
}: ServiceConfig): IThreadVariablesApiService => ({
	locateVariables: async (
		threadId: string,
	): Promise<ThreadVariablesResponse> => {
		const response = await axiosInstance.get(
			`/v1/threads/${threadId}/variables`,
		);
		return applyTransform(response.data, [
			snakeToCamel(),
		]);
	},

	setVariables: async (
		threadId: string,
		params: ThreadSetVariablesParams,
	): Promise<ThreadVariablesResponse> => {
		const response = await axiosInstance.post(
			`/v1/threads/${threadId}/variables`,
			params,
		);
		return applyTransform(response.data, [
			snakeToCamel(),
		]);
	},

	/**
	 * Sends key list in request body. Empty `keys` flushes all variables.
	 */
	flushVariables: async (
		threadId: string,
		params: ThreadFlushVariablesParams,
	): Promise<ThreadVariablesResponse> => {
		const response = await axiosInstance.delete(
			`/v1/threads/${threadId}/variables/flush`,
			{
				data: params,
			},
		);
		return applyTransform(response.data, [
			snakeToCamel(),
		]);
	},
});
