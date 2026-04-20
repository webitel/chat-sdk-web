import type {
	WebitelImApiGatewayV1Contact as ContactModel,
	ContactsSearchParams as ContactSearchParams,
	WebitelImApiGatewayV1ContactList as ContactSearchRawResult,
} from '@webitel/api-services/gen/models';

import type { ServiceConfigurable } from '../../configs';
import type {
	MessageSendAttachments,
	MessageSendDocumentRawResponse,
	MessageSendImageRawResponse,
	MessageSendTextRawResponse,
} from '../../messages/types/Message.types';

/**
 * Unified contact send-message params.
 *
 * A message carries an optional text `body` and at most one
 * `attachments` payload (tagged by `type`). Text-only messages omit
 * `attachments`.
 */
interface ContactSendMessageParams {
	body?: string;
	attachments?: MessageSendAttachments;
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
