import type { ServiceConfig } from '../../configs';
import { useMessagesService } from '../../messages';
import { MessageAttachmentType } from '../../messages/enums/MessageAttachmentType.enum';
import type {
	ContactModel,
	ContactSendMessageOptions,
	ContactSendMessageParams,
	ContactSendMessageResponse,
	IContact,
} from '../types/Contact.types';

class Contact implements IContact {
	private readonly _serviceConfig: ServiceConfig;
	sub!: string;
	iss!: string;

	constructor(
		rawContact: ContactModel,
		{
			serviceConfig,
		}: {
			serviceConfig: ServiceConfig;
		},
	) {
		Object.assign(this, rawContact);
		this._serviceConfig = serviceConfig;
	}

	async sendMessage(
		{ body, attachments }: ContactSendMessageParams,
		{ sendId }: ContactSendMessageOptions = {},
	): Promise<ContactSendMessageResponse> {
		const messagesService = useMessagesService(this.serviceConfig);
		const to = {
			contact: {
				sub: this.sub,
				iss: this.iss,
			},
		};

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

	get serviceConfig(): ServiceConfig {
		return this._serviceConfig;
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
