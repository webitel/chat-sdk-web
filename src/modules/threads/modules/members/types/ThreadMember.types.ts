import type {
	WebitelImApiGatewayV1AddMemberResponse as ThreadAddMemberResponse,
	WebitelImApiGatewayV1ThreadMember as ThreadMemberRawModel,
	WebitelImApiGatewayV1RemoveMemberResponse as ThreadRemoveMemberResponse,
} from '@webitel/api-services/gen/models';

import type {
	ContactModel,
	IContact,
} from '../../../../contacts/types/Contact.types';

type ThreadMemberModel = ThreadMemberRawModel & {
	id: NonNullable<ThreadMemberRawModel['id']>;
	contact: ContactModel;
};

interface IThreadMember extends Omit<ThreadMemberModel, 'contact'> {
	contact: IContact;
	removeFromThread: () => Promise<ThreadRemoveMemberResponse>;
}

type ThreadAddMemberParams = Required<
	Pick<ThreadMemberModel, 'contact' | 'role'>
>;

/** `DELETE /v1/threads/{threadId}/members/{memberId}` */
type ThreadRemoveMemberParams = Required<Pick<ThreadMemberModel, 'id'>>;

export type {
	IThreadMember,
	ThreadAddMemberParams,
	ThreadAddMemberResponse,
	ThreadMemberModel,
	ThreadRemoveMemberParams,
	ThreadRemoveMemberResponse,
};
