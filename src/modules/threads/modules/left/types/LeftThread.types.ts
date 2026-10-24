import type {
	ThreadManagementSearchParams,
	WebitelImApiGatewayV1Thread as ThreadRawModel,
} from '@webitel/api-services/gen/models';

import type {
	MessageHistorySearchParams,
	MessageHistorySearchResult,
} from '../../../../messages/types/Message.types';
import type {
	ThreadMemberModel,
	ThreadModel,
} from '../../../types/Thread.types';

/**
 * `GET /v1/threads/left` query. Mirrors the generated
 * `ThreadManagementSearchLeftParams`, which is not in the `@webitel/api-services`
 * line this SDK builds against; replace it with that type once the SDK moves to
 * a line that has it.
 */
type LeftThreadSearchParams = Pick<
	ThreadManagementSearchParams,
	'fields' | 'types' | 'sort' | 'size' | 'page'
>;

/**
 * `GET /v1/threads/left` response (generated `SearchLeftResponse`)
 */
type LeftThreadSearchRawResult = {
	items?: ThreadRawModel[];
	next?: boolean;
};

type LeftThreadSearchResult = {
	items: ILeftThread[];
	next: boolean;
};

/**
 * A thread the caller has left. Its `members` are plain data: a former member
 * cannot act on them, nor send, transfer or set variables, only read.
 */
interface ILeftThread extends Omit<ThreadModel, 'members'> {
	id: ThreadModel['id'];
	members: ThreadMemberModel[];

	fetchMessageHistory: (
		params?: MessageHistorySearchParams,
	) => Promise<MessageHistorySearchResult>;
}

export type {
	ILeftThread,
	LeftThreadSearchParams,
	LeftThreadSearchRawResult,
	LeftThreadSearchResult,
};
