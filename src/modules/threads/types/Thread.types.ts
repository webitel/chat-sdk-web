import type {
	WebitelImApiGatewayV1Thread as ThreadModel,
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
	ThreadAddMemberParams,
	ThreadAddMemberResponse,
	ThreadMemberContact,
	ThreadMemberModel,
	ThreadRemoveMemberParams,
	ThreadRemoveMemberResponse,
} from '../modules/members/types/ThreadMember.types';

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
	ThreadMemberContact,
	ThreadMemberModel,
	ThreadModel,
	ThreadRemoveMemberParams,
	ThreadRemoveMemberResponse,
	ThreadSearchParams,
	ThreadSearchRawResult,
	ThreadSearchResult,
};
