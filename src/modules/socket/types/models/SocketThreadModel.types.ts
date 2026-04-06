import type { ThreadModel } from '../../../threads/types/Thread.types';
import type { SocketContactModel } from './SocketContactModel.types';

/**
 * @see https://github.com/webitel/im-delivery-service/blob/main/api/asyncapi/asyncapi.yaml#L154-L165
 */
export interface SocketThreadModel
	extends Pick<ThreadModel, 'id' | 'createdAt' | 'subject' | 'kind'> {
	domainId: unknown; // no need
	type: ThreadModel['kind']; // todo: remove "kind", use "type"
	members: SocketContactModel[];
}
