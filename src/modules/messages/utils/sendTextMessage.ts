import type { ServiceConfig } from '../../configs';
import { getMessagesService } from '../api/Messages.api';
import type {
	MessageSendTextParams,
	MessageSendTextRawResponse,
} from '../types/Message.types';

const sendTextMessage = async (
	config: ServiceConfig,
	params: MessageSendTextParams,
): Promise<MessageSendTextRawResponse> => {
	return getMessagesService(config).sendTextMessage(params);
};

export { sendTextMessage };
