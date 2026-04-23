import type { WebitelImApiGatewayV1Peer as MessagePeer } from '@webitel/api-services/gen/models';

import { MessageAttachmentType } from '../enums/MessageAttachmentType.enum';
import type { IMessagesService } from '../messagesService';
import type {
	MessageSendOptions,
	MessageSendParams,
	MessageSendResponse,
} from '../types/Message.types';

export async function routeMessageSend(
	messagesService: IMessagesService,
	to: MessagePeer,
	{ body, attachments }: MessageSendParams,
	{ sendId }: MessageSendOptions = {},
): Promise<MessageSendResponse> {
	switch (attachments?.type) {
		case MessageAttachmentType.Images:
			return messagesService.sendImageMessage({
				files: attachments.files,
				body,
				sendId,
				to,
			});
		case MessageAttachmentType.Documents:
			return messagesService.sendDocumentMessage({
				files: attachments.files,
				body,
				sendId,
				to,
			});
		default:
			return messagesService.sendTextMessage({
				body: body ?? '',
				sendId,
				to,
			});
	}
}
