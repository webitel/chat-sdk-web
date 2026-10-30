import type { ContactModel } from '../../../contacts/types/Contact.types';

export type SocketContactModel = Pick<
	ContactModel,
	'sub' | 'name' | 'username' | 'iss' | 'type' | 'isBot'
>;
