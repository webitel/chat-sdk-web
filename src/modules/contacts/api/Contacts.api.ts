// import {
    // WebitelImApiGatewayV1Contact,
// } from '@webitel/api-services/gen';

import type { ServiceConfig } from '../../configs';

// todo: replace me with @webitel/api-services/gen
export const getContactsList = async ({ axiosInstance }: ServiceConfig) => {
    const response = await axiosInstance.get('/v1/contacts');
    return response.data;
};
