import type {
	WebitelImApiGatewayV1AddMemberResponse as ThreadAddMemberResponse,
	WebitelImApiGatewayV1ThreadMember,
	WebitelImApiGatewayV1RemoveMemberResponse as ThreadRemoveMemberResponse,
} from '@webitel/api-services/gen/models';

import type { IContact } from '../../../../contacts/types/Contact.types';

/** Contact identity shape – derived from the member model's contact field. */
type ThreadMemberContact = NonNullable<ThreadMemberModel['contact']>;

type ThreadMemberModel = WebitelImApiGatewayV1ThreadMember & {
	id: NonNullable<WebitelImApiGatewayV1ThreadMember['id']>;
	contact: IContact;
};

interface IThreadMember extends Omit<ThreadMemberModel, 'contact'> {
	id: NonNullable<ThreadMemberModel['id']>;
	contact: IContact;
	removeFromThread: () => Promise<ThreadRemoveMemberResponse>;
}

/**
 * `POST /v1/threads/{threadId}/members`
 *
 * `contact` is required; `role` is optional — both picked from `ThreadMemberModel`.
 * The contact shape (`{ sub, iss, ... }`) is structurally satisfied by `IContact`.
 * Flattened to `contact_sub` / `contact_iss` query params by the API layer.
 */
type ThreadAddMemberParams = Required<
	Pick<ThreadMemberModel, 'contact' | 'role'>
>;

/** `DELETE /v1/threads/{threadId}/members/{memberId}` */
type ThreadRemoveMemberParams = Required<Pick<ThreadMemberModel, 'id'>>;

export type {
	IThreadMember,
	ThreadAddMemberParams,
	ThreadAddMemberResponse,
	ThreadMemberContact,
	ThreadMemberModel,
	ThreadRemoveMemberParams,
	ThreadRemoveMemberResponse,
};
