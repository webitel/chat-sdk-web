import type { ServiceConfig } from '../../configs';
import { getContactsList } from '../api/Contacts.api';

export const fetchContacts = async (config: ServiceConfig) => {
    return getContactsList(config);
}