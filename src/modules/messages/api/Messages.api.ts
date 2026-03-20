import type { ServiceConfig } from '../../configs';
import type {
    MessageHistorySearchThreadMessagesHistoryWebitelImApiGatewayV1MessageHistoryParams,
    WebitelImApiGatewayV1SearchMessageHistoryResponse,
} from '@webitel/api-services/gen/models';

/**
 * Message history for a thread: `GET /v1/{threadId}/messages`
 * @see webitel-im-api-gateway-v1-messagehistory
 */
export const getMessagesService = ({ axiosInstance }: ServiceConfig) => {
    return {
        getMessageHistory: async (
            threadId: string,
            params: MessageHistorySearchThreadMessagesHistoryWebitelImApiGatewayV1MessageHistoryParams = {},
        ): Promise<WebitelImApiGatewayV1SearchMessageHistoryResponse> => {
            const response = await axiosInstance.get(`/v1/${threadId}/messages`, { params });
            return response.data;
        },
    };
};
