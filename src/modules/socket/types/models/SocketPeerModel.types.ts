import type { SocketContactModel } from './SocketContactModel.types';

/**
 * A thread participant: a message `sender`, `editedBy`, `deletedBy`, a status
 * `member`, a typing `from`, a thread's `members`.
 *
 * @see https://github.com/webitel/im-delivery-service/blob/main/api/asyncapi/asyncapi.yaml `WSPeer`
 */
export interface SocketPeerModel {
	/** member id */
	id: string;
	contact: SocketContactModel;
	/** e.g. `member`, `admin` */
	role: string;
}
