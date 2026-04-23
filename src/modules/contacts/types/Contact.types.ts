import type {
	WebitelImApiGatewayV1Contact as ContactRawModel,
	ContactsSearchParams as ContactSearchParams,
	WebitelImApiGatewayV1ContactList as ContactSearchRawResult,
} from '@webitel/api-services/gen/models';

import type { ServiceConfigurable } from '../../configs';
import type { IMessageSender } from '../../messages/types/Message.types';

/**
 * Refined ContactRawModel with additional properties for the Contact class
 */
interface ContactModel extends ContactRawModel {}

interface IContact extends ContactModel, ServiceConfigurable, IMessageSender {
	sub: ContactModel['sub'];
	iss: ContactModel['iss'];
}

type ContactSearchResult = Omit<ContactSearchRawResult, 'items'> & {
	items: IContact[];
};

export type {
	ContactModel,
	ContactRawModel,
	ContactSearchParams,
	ContactSearchRawResult,
	ContactSearchResult,
	IContact,
};
