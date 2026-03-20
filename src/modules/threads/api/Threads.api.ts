import type { ServiceConfig } from '../../configs';
import type {
    WebitelImApiGatewayV1SearchThreadResponse,
} from '@webitel/api-services/gen/models';

// Threads endpoint returns a paginated list in `WebitelImApiGatewayV1SearchThreadResponse`.
const getThreadsList = async (
    { axiosInstance }: ServiceConfig,
): Promise<WebitelImApiGatewayV1SearchThreadResponse> => {
    const response = await axiosInstance.get('/v1/threads');
    return response.data;
};

export { getThreadsList };