import { applyTransform, snakeToCamel, camelToSnake } from '@webitel/api-services/api/transformers';

import type { MessageHistorySearchParams, MessageHistorySearchRawResponse } from '../types/Message.types';
import type { ServiceConfig } from '../../configs';

/**
 * Message history for a thread: `GET /v1/{threadId}/messages`
 * @see webitel-im-api-gateway-v1-messagehistory
 */
export const getMessagesService = ({ axiosInstance }: ServiceConfig) => {
    return {
        getMessageHistory: async (
            threadId: string,
            params: MessageHistorySearchParams = {},
        ): Promise<MessageHistorySearchRawResponse> => {
            const transformedParams = applyTransform(params, [
                camelToSnake(),
            ]);

            const response = await axiosInstance.get(`/v1/${threadId}/messages`, { params: transformedParams });
            return applyTransform(response.data, [
                snakeToCamel(),
            ]);
        },
    };
};
