import type { ContactsSearchParams } from '@webitel/api-services/gen/models';

import type { ServiceConfig } from '../configs';
import { fetchContacts } from './utils/fetchContacts';

export function useContactsService(config: ServiceConfig) {
    return {
        fetchContacts: (params?: ContactsSearchParams) => fetchContacts(config, params ?? {}),
    };
}
