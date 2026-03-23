import { applyTransform, snakeToCamel, camelToSnake } from '@webitel/api-services/api/transformers';

import type { ServiceConfig } from '../../configs';
import type { ThreadSearchParams, ThreadSearchRawResult } from '../types/Thread.types';

export const getThreadsService = ({ axiosInstance }: ServiceConfig) => {
    return {
        getThreadsList: async (params: ThreadSearchParams = {}): Promise<ThreadSearchRawResult> => {
            const transformedParams = applyTransform(params, [
                camelToSnake(),
            ]);

            const response = await axiosInstance.get('/v1/threads', { params: transformedParams });
            return applyTransform(response.data, [
                snakeToCamel(),
            ]);
        },
    };
};
