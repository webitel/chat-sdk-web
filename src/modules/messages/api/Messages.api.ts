import type { ServiceConfig } from '../../configs';
import type {
    WebitelImApiGatewayV1SearchMessageHistoryResponse,
} from '@webitel/api-services/gen/models';

/**
 * Message history for a thread: `GET /v1/{threadId}/messages`
 * @see webitel-im-api-gateway-v1-messagehistory
 */
const getMessageHistory = async (
    { axiosInstance }: ServiceConfig,
    threadId: string,
): Promise<WebitelImApiGatewayV1SearchMessageHistoryResponse> => {
    const response = await axiosInstance.get(`/v1/${threadId}/messages`);
    return response.data;
};

export { getMessageHistory };
