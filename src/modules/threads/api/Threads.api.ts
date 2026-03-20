import type { ServiceConfig } from '../../configs';
import type {
    ThreadManagementSearchParams,
    WebitelImApiGatewayV1SearchThreadResponse,
} from '@webitel/api-services/gen/models';

export const getThreadsService = ({ axiosInstance }: ServiceConfig) => {
    return {
        getThreadsList: async (params: ThreadManagementSearchParams = {}): Promise<WebitelImApiGatewayV1SearchThreadResponse> => {
            const response = await axiosInstance.get('/v1/threads', { params });
            return response.data;
        },
    };
};
