import type { ServiceConfig } from '../configs';
import type { ContactSearchParams } from './types/Contact.types';
import { fetchContacts } from './utils/fetchContacts';

export function useContactsService(config: ServiceConfig) {
	return {
		fetchContacts: (params?: ContactSearchParams) =>
			fetchContacts(config, params ?? {}),
	};
}
