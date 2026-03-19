import type { ServiceConfig } from '../configs';
import { fetchContacts } from './utils/fetchContacts';

export function useContactsService(config: ServiceConfig) {
    return {
        fetchContacts: () => fetchContacts(config),
    }
}
