import type {
	WebitelImApiGatewayV1Thread as ThreadModel,
	ThreadManagementSearchParams as ThreadSearchParams,
	WebitelImApiGatewayV1SearchThreadResponse as ThreadSearchRawResult,
} from '@webitel/api-services/gen/models';

import type { ServiceConfigurable } from '../../configs';
import type {
	MessageHistorySearchParams,
	MessageHistorySearchResult,
} from '../../messages/types/Message.types';

interface IThread extends ThreadModel, ServiceConfigurable {
	id: string;

	fetchMessageHistory: (
		params?: MessageHistorySearchParams,
	) => Promise<MessageHistorySearchResult>;
}

type ThreadSearchResult = Omit<ThreadSearchRawResult, 'threads'> & {
	threads: IThread[];
};

export type {
	IThread,
	ThreadModel,
	ThreadSearchParams,
	ThreadSearchRawResult,
	ThreadSearchResult,
};
