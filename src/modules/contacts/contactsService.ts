import type { ServiceConfig } from '../configs';
import type { ContactSearchParams } from './types/Contact.types';
import { fetchContacts } from './utils/fetchContacts';

export function createContactsService(config: ServiceConfig) {
	return {
		fetchContacts: (params?: ContactSearchParams) =>
			fetchContacts(config, params),
	};
}
