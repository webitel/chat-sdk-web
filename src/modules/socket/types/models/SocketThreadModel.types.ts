import type { SocketPeerModel } from './SocketPeerModel.types';

/**
 * @see https://github.com/webitel/im-delivery-service/blob/main/api/asyncapi/asyncapi.yaml `WSThread`
 */
export interface SocketThreadModel {
	id: string;
	domainId: number;
	/** Unix ms */
	createdAt: number;
	subject: string;
	type: string;
	members?: SocketPeerModel[];
}
