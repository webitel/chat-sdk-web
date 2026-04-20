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

interface IThread extends ThreadModel, ServiceConfigurable, IMessageSender {
	id: string;

	fetchMessageHistory: (
		params?: MessageHistorySearchParams,
	) => Promise<MessageHistorySearchResult>;
}

type ThreadSearchResult = Omit<ThreadSearchRawResult, 'items'> & {
	items: IThread[];
};

export type {
	IThread,
	ThreadModel,
	ThreadSearchParams,
	ThreadSearchRawResult,
	ThreadSearchResult,
};
