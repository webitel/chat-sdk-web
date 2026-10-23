import type { ServiceConfig } from '../../configs';
import { getMessagesService } from '../api/Messages.api';
import type {
	MessageHistorySearchParams,
	MessageHistorySearchResult,
	MessageModel,
} from '../types/Message.types';
import { instantiateMessages } from './fetchMessageHistory';

/**
 * Fetches the history of a thread the user has left and returns `Message`
 * class instances in `items`.
 */
const fetchLeftThreadMessageHistory = async (
	config: ServiceConfig,
	threadId: string,
	params: MessageHistorySearchParams = {},
): Promise<MessageHistorySearchResult> => {
	const rawResponse = await getMessagesService(
		config,
	).getLeftThreadMessageHistory(threadId, params);
	return {
		...rawResponse,
		items: instantiateMessages((rawResponse.items as MessageModel[]) ?? [], {
			serviceConfig: config,
		}),
	};
};

export { fetchLeftThreadMessageHistory };
