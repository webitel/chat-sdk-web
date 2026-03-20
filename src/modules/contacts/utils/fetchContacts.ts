import type { ContactsSearchParams } from '@webitel/api-services/gen/models';

import type { ServiceConfig } from '../../configs';
import { getContactsService } from '../api/Contacts.api';
import { createContact } from '../classes/Contact.class';
import type { ContactModel } from '../types/Contact.types';

const fetchRawContacts = (config: ServiceConfig) => async (params: ContactsSearchParams = {}) => {
    const response = await getContactsService(config).getContactsList(params);
    return response;
};

const instantiateContacts = (rawContacts: ContactModel[]) => {
    return rawContacts.map((rawContact) => createContact(rawContact));
};

/**
 * Fetches contacts and returns `Contact` class instances in `items`.
 */
const fetchContacts = async (config: ServiceConfig, params: ContactsSearchParams = {}) => {
    const rawResponse = await fetchRawContacts(config)(params);
    return {
        ...rawResponse,
        items: instantiateContacts(rawResponse.items ?? []),
    };
};

export {
    fetchRawContacts,
    fetchContacts,
};
