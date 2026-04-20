import type {
	WebitelImApiGatewayV1AddMemberResponse as ThreadAddMemberResponse,
	WebitelImApiGatewayV1PeerIdentity as ThreadMemberContact,
	WebitelImApiGatewayV1RemoveMemberResponse as ThreadRemoveMemberResponse,
	WebitelImApiGatewayV1Thread as ThreadModel,
	ThreadManagementSearchParams as ThreadSearchParams,
	WebitelImApiGatewayV1SearchThreadResponse as ThreadSearchRawResult,
	WebitelImApiGatewayV1ThreadMember as ThreadMember,
} from '@webitel/api-services/gen/models';

import type { ServiceConfigurable } from '../../configs';
import type {
	IMessageSender,
	MessageHistorySearchParams,
	MessageHistorySearchResult,
} from '../../messages/types/Message.types';
import type { ThreadMemberRole } from '../enums/ThreadMemberRole.enum';

/**
 * `POST /v1/threads/{threadId}/members`
 *
 * `contact` reuses the backend `Peer.contact` identity shape (`{ sub, iss }`)
 * — same shape used by messaging APIs and structurally satisfied by
 * `IContact`. Flattened to `contact_sub` / `contact_iss` query params.
 */
interface ThreadAddMemberParams {
	contact: ThreadMemberContact;
	role?: ThreadMemberRole;
}

/** `DELETE /v1/threads/{threadId}/members` */
interface ThreadRemoveMemberParams {
	contact: ThreadMemberContact;
}

interface IThread extends ThreadModel, ServiceConfigurable, IMessageSender {
	id: string;

	fetchMessageHistory: (
		params?: MessageHistorySearchParams,
	) => Promise<MessageHistorySearchResult>;

	addMember: (
		params: ThreadAddMemberParams,
	) => Promise<ThreadAddMemberResponse>;

	removeMember: (
		params: ThreadRemoveMemberParams,
	) => Promise<ThreadRemoveMemberResponse>;
}

type ThreadSearchResult = Omit<ThreadSearchRawResult, 'items'> & {
	items: IThread[];
};

export type {
	IThread,
	ThreadAddMemberParams,
	ThreadAddMemberResponse,
	ThreadMember,
	ThreadMemberContact,
	ThreadMemberRole,
	ThreadModel,
	ThreadRemoveMemberParams,
	ThreadRemoveMemberResponse,
	ThreadSearchParams,
	ThreadSearchRawResult,
	ThreadSearchResult,
};
