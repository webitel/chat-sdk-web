import type { ServiceConfig } from '../configs';
import { fetchContacts } from './utils/fetchContacts';
import type { ContactSearchParams } from './types/Contact.types';

export function useContactsService(config: ServiceConfig) {
    return {
        fetchContacts: (params?: ContactSearchParams) => fetchContacts(config, params ?? {}),
    };
}
