import type { ServiceConfig } from '../../configs';
import { getContactsService } from '../api/Contacts.api';
import { createContact } from '../classes/Contact.class';
import type {
    ContactModel,
    ContactSearchParams,
    ContactSearchRawResult,
    ContactSearchResult,
    IContact,
} from '../types/Contact.types';

const fetchRawContacts = (config: ServiceConfig) => async (
    params: ContactSearchParams = {},
): Promise<ContactSearchRawResult> => {
    const response = await getContactsService(config).getContactsList(params);
    return response;
};

const instantiateContacts = (
    rawContacts: ContactModel[],
    { serviceConfig }: { serviceConfig: ServiceConfig },
): IContact[] => {
    return rawContacts.map((rawContact) => createContact(rawContact, { serviceConfig }));
};

/**
 * Fetches contacts and returns `Contact` class instances in `items`.
 */
const fetchContacts = async (config: ServiceConfig, params: ContactSearchParams = {}): Promise<ContactSearchResult> => {
    const rawResponse = await fetchRawContacts(config)(params);
    return {
        ...rawResponse,
        items: instantiateContacts(rawResponse.items ?? [], {
            serviceConfig: config,
        }),
    };
};

export {
    fetchRawContacts,
    fetchContacts,
};
