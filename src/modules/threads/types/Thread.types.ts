import type {
	WebitelImApiGatewayV1Thread as ThreadRawModel,
	ThreadManagementSearchParams as ThreadSearchParams,
	WebitelImApiGatewayV1SearchThreadResponse as ThreadSearchRawResult,
} from '@webitel/api-services/gen/models';

import type { ServiceConfigurable } from '../../configs';
import type {
	IMessageSender,
	MessageHistorySearchParams,
	MessageHistorySearchResult,
} from '../../messages/types/Message.types';
import type {
	IThreadMember,
	ThreadAddMemberParams,
	ThreadAddMemberResponse,
	ThreadMemberModel,
	ThreadRemoveMemberParams,
	ThreadRemoveMemberResponse,
} from '../modules/members/types/ThreadMember.types';
import type {
	ThreadFlushVariablesParams,
	ThreadSearchVariablesParams,
	ThreadSearchVariablesResponse,
	ThreadSetVariablesParams,
	ThreadVariablesModel,
	ThreadVariablesResponse,
} from '../modules/variables/types/ThreadVariable.types';

type ThreadModel = ThreadRawModel & {
	id: NonNullable<ThreadRawModel['id']>;
};

interface IThread
	extends Omit<ThreadModel, 'members'>,
		ServiceConfigurable,
		IMessageSender {
	id: ThreadModel['id'];
	members: IThreadMember[];

	fetchMessageHistory: (
		params?: MessageHistorySearchParams,
	) => Promise<MessageHistorySearchResult>;

	addMember: (
		params: ThreadAddMemberParams,
	) => Promise<ThreadAddMemberResponse>;

	removeMember: (
		params: ThreadRemoveMemberParams,
	) => Promise<ThreadRemoveMemberResponse>;

	locateVariables: () => Promise<ThreadVariablesResponse>;

	setVariables: (
		params: ThreadSetVariablesParams,
	) => Promise<ThreadVariablesResponse>;

	flushVariables: (
		params: ThreadFlushVariablesParams,
	) => Promise<ThreadVariablesResponse>;
}

type ThreadSearchResult = Omit<ThreadSearchRawResult, 'items'> & {
	items: IThread[];
};

export type {
	IThread,
	IThreadMember,
	ThreadAddMemberParams,
	ThreadAddMemberResponse,
	ThreadFlushVariablesParams,
	ThreadMemberModel,
	ThreadModel,
	ThreadRemoveMemberParams,
	ThreadRemoveMemberResponse,
	ThreadSearchParams,
	ThreadSearchRawResult,
	ThreadSearchResult,
	ThreadSearchVariablesParams,
	ThreadSearchVariablesResponse,
	ThreadSetVariablesParams,
	ThreadVariablesModel,
	ThreadVariablesResponse,
};
