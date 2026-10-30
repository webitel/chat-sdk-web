import type { MessageSendTextParams } from '../../../messages/types/Message.types';
import type { SocketPeerModel } from './SocketPeerModel.types';

export type SocketMessageType =
	| 'text'
	| 'image'
	| 'document'
	| 'system'
	| 'interactive'
	| 'location'
	| 'contact';

/**
 * @see https://github.com/webitel/im-delivery-service/blob/main/api/asyncapi/asyncapi.yaml `WSMessage`
 */
export interface SocketMessageModel {
	id: string;
	sendId: MessageSendTextParams['sendId']; // "echo" from sendMessage request
	threadId: string;
	sender: SocketPeerModel;
	to?: SocketPeerModel[];
	/** Unix ms */
	createdAt: number;
	/** Unix ms */
	editedAt?: number;
	body: string;
	type: SocketMessageType;
	images?: {
		id: string;
		name: string;
		mime: string;
		url: string;
	}[];
	documents?: {
		id: string;
		name: string;
		mime: string;
		size: number;
		url: string;
	}[];
	/** raw buttons / keyboard payload, passed through as-is */
	interactive?: Record<string, unknown>;
	/** contact card shared in the message */
	contact?: {
		name?: string;
		phone?: string;
		email?: string;
	};
	location?: {
		latitude: number;
		longitude: number;
		address?: string;
		name?: string;
	};
	system?: {
		type: string;
		metadata?: Record<string, unknown>;
	};
	metadata?: Record<string, unknown>;
	/** compact snapshot of the quoted message */
	replyTo?: {
		messageId: string;
		sender?: SocketPeerModel;
		senderId: string;
		type: SocketMessageType;
		/** at most 256 chars */
		body: string;
		createdAt: number;
		attachmentKind?: 'document' | 'image';
		attachmentName?: string;
		attachmentMime?: string;
		attachmentAddress?: string;
		/** the quoted message was deleted after the reply was sent */
		isDeleted?: boolean;
	};
	forwardOrigin?: {
		kind:
			| 'FORWARD_ORIGIN_KIND_UNSPECIFIED'
			| 'FORWARD_ORIGIN_KIND_INTERNAL'
			| 'FORWARD_ORIGIN_KIND_EXTERNAL_USER'
			| 'FORWARD_ORIGIN_KIND_EXTERNAL_HIDDEN_USER'
			| 'FORWARD_ORIGIN_KIND_EXTERNAL_CHAT';
		senderId?: string;
		senderName?: string;
		originalSentAt?: number;
		sourceMessageId?: string;
	};
	/** per-thread sequence number */
	seq?: number;
	/** the recipient's `GET /v1/updates` cursor after this message */
	updatesCursor?: string;
}
