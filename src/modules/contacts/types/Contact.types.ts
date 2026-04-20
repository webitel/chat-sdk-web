import type {
	WebitelImApiGatewayV1Contact as ContactModel,
	ContactsSearchParams as ContactSearchParams,
	WebitelImApiGatewayV1ContactList as ContactSearchRawResult,
} from '@webitel/api-services/gen/models';

import type { ServiceConfigurable } from '../../configs';
import type {
	MessageSendDocumentRawResponse,
	MessageSendImageRawResponse,
	MessageSendTextRawResponse,
} from '../../messages/types/Message.types';

/**
 * Unified contact send-message params.
 *
 * - text-only message: pass `body`
 * - document message (optionally with caption): pass `documents` + optional `body`
 * - image message (optionally with caption): pass `images` + optional `body`
 *
 * `images` take precedence over `documents` when both are provided.
 */
interface ContactSendMessageParams {
	body?: string;
	documents?: File | readonly File[];
	images?: File | readonly File[];
}

interface ContactSendMessageOptions {
	sendId?: string;
}

type ContactSendMessageResponse =
	| MessageSendTextRawResponse
	| MessageSendDocumentRawResponse
	| MessageSendImageRawResponse;

interface IContact extends ContactModel, ServiceConfigurable {
	sendMessage: (
		params: ContactSendMessageParams,
		options?: ContactSendMessageOptions,
	) => Promise<ContactSendMessageResponse>;
}

type ContactSearchResult = Omit<ContactSearchRawResult, 'items'> & {
	items: IContact[];
};

export type {
	ContactModel,
	ContactSearchParams,
	ContactSearchRawResult,
	ContactSearchResult,
	ContactSendMessageOptions,
	ContactSendMessageParams,
	ContactSendMessageResponse,
	IContact,
};
