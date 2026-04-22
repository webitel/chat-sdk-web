import type {
	WebitelImApiGatewayV1AddMemberResponse as ThreadAddMemberResponse,
	WebitelImApiGatewayV1RemoveMemberResponse as ThreadRemoveMemberResponse,
	WebitelImApiGatewayV1ThreadMember as ThreadMemberModel,
} from '@webitel/api-services/gen/models';

/** Contact identity shape – derived from the member model's contact field. */
type ThreadMemberContact = NonNullable<ThreadMemberModel['contact']>;

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
	ThreadAddMemberParams,
	ThreadAddMemberResponse,
	ThreadMemberContact,
	ThreadMemberModel,
	ThreadRemoveMemberParams,
	ThreadRemoveMemberResponse,
};
