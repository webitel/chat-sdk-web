import type {
	MessageModel,
	MessageSendTextParams,
} from '../../../messages/types/Message.types';
import type { SocketContactModel } from './SocketContactModel.types';

/**
 * @see https://github.com/webitel/im-delivery-service/blob/main/api/asyncapi/asyncapi.yaml#L104
 */
export interface SocketMessageModel
	extends Pick<
		MessageModel,
		'id' | 'threadId' | 'createdAt' | 'updatedAt' | 'body' | 'type'
	> {
	sendId: MessageSendTextParams['sendId']; // "echo" from sendMessage request
	to: SocketContactModel;
	sender: SocketContactModel;
}
