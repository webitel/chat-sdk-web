import type { ThreadModel } from '../../../threads/types/Thread.types';
import type { SocketContactModel } from './SocketContactModel.types';

/**
 * @see https://github.com/webitel/im-delivery-service/blob/main/api/asyncapi/asyncapi.yaml#L154-L165
 */
export interface SocketThreadModel
	extends Pick<ThreadModel, 'id' | 'createdAt' | 'subject' | 'type'> {
	domainId: unknown; // no need
	members: SocketContactModel[];
}
