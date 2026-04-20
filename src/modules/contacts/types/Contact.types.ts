import type {
	WebitelImApiGatewayV1Contact as ContactModel,
	ContactsSearchParams as ContactSearchParams,
	WebitelImApiGatewayV1ContactList as ContactSearchRawResult,
} from '@webitel/api-services/gen/models';

import type { ServiceConfigurable } from '../../configs';
import type { IMessageSender } from '../../messages/types/Message.types';

interface IContact extends ContactModel, ServiceConfigurable, IMessageSender {}

type ContactSearchResult = Omit<ContactSearchRawResult, 'items'> & {
	items: IContact[];
};

export type {
	ContactModel,
	ContactSearchParams,
	ContactSearchRawResult,
	ContactSearchResult,
	IContact,
};
