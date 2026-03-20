import type { ServiceConfig } from '../../configs';
import type {
    ContactsSearchParams,
    WebitelImApiGatewayV1ContactList,
} from '@webitel/api-services/gen/models';

export const getContactsService = ({ axiosInstance }: ServiceConfig) => {
    return {
        getContactsList: async (params: ContactsSearchParams = {}): Promise<WebitelImApiGatewayV1ContactList> => {
            const response = await axiosInstance.get('/v1/contacts', { params });
            return response.data;
        },
    };
};
