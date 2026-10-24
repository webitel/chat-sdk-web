import {
	applyTransform,
	camelToSnake,
	snakeToCamel,
} from '@webitel/api-services/api/transformers';

import type { ServiceConfig } from '../../../../configs';
import type {
	LeftThreadSearchParams,
	LeftThreadSearchRawResult,
} from '../types/LeftThread.types';

interface ILeftThreadsApiService {
	getLeftThreadsList: (
		params?: LeftThreadSearchParams,
	) => Promise<LeftThreadSearchRawResult>;
}

/**
 * Threads the caller has left: `GET /v1/threads/left`
 */
export const getLeftThreadsService = ({
	axiosInstance,
}: ServiceConfig): ILeftThreadsApiService => ({
	getLeftThreadsList: async (
		params: LeftThreadSearchParams = {},
	): Promise<LeftThreadSearchRawResult> => {
		const transformedParams = applyTransform(params, [
			camelToSnake(),
		]);

		const response = await axiosInstance.get('/v1/threads/left', {
			params: transformedParams,
		});
		return applyTransform(response.data, [
			snakeToCamel([
				'variables',
			]),
		]);
	},
});
