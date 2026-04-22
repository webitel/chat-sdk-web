import type { ServiceConfig } from '../../configs';
import { type IMessagesService, useMessagesService } from '../../messages';
import { MessageAttachmentType } from '../../messages/enums/MessageAttachmentType.enum';
import type {
	MessageSendOptions,
	MessageSendParams,
	MessageSendResponse,
} from '../../messages/types/Message.types';
import type { ContactModel, IContact } from '../types/Contact.types';

class Contact implements IContact {
	private readonly _serviceConfig: ServiceConfig;
	private readonly _messagesService: IMessagesService;
	readonly sub;
	readonly iss;

	constructor(
		rawContact: ContactModel,
		{
			serviceConfig,
		}: {
			serviceConfig: ServiceConfig;
		},
	) {
		this._serviceConfig = serviceConfig;
		this._messagesService = useMessagesService(serviceConfig);

		const { sub, iss, ...rest } = rawContact;
		Object.assign(this, rest);
		this.sub = sub;
		this.iss = iss;
	}

	async sendMessage(
		{ body, attachments }: MessageSendParams,
		{ sendId }: MessageSendOptions = {},
	): Promise<MessageSendResponse> {
		const to = {
			contact: {
				sub: this.sub,
				iss: this.iss,
			},
		};

		switch (attachments?.type) {
			case MessageAttachmentType.Images:
				return this.messagesService.sendImageMessage({
					files: attachments.files,
					body,
					sendId,
					to,
				});
			case MessageAttachmentType.Documents:
				return this.messagesService.sendDocumentMessage({
					files: attachments.files,
					body,
					sendId,
					to,
				});
			default:
				return this.messagesService.sendTextMessage({
					body: body ?? '',
					sendId,
					to,
				});
		}
	}

	get serviceConfig(): ServiceConfig {
		return this._serviceConfig;
	}

	get messagesService(): IMessagesService {
		return this._messagesService;
	}
}

export function createContact(
	rawContact: ContactModel,
	{
		serviceConfig,
	}: {
		serviceConfig: ServiceConfig;
	},
): IContact {
	return new Contact(rawContact, {
		serviceConfig,
	});
}
