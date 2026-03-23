import type {
	WebitelImApiGatewayV1Contact as ContactModel,
	ContactsSearchParams as ContactSearchParams,
	WebitelImApiGatewayV1ContactList as ContactSearchRawResult,
} from '@webitel/api-services/gen/models';

import type { ServiceConfigurable } from '../../configs';

interface IContact extends ContactModel, ServiceConfigurable {
	sendMessage: () => {}; // todo
}

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
