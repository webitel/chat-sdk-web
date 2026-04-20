import type { ServiceConfig } from '../../configs';
import { useMessagesService } from '../../messages';
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
		{ body, documents, images }: ContactSendMessageParams,
		{ sendId }: ContactSendMessageOptions = {},
	): Promise<ContactSendMessageResponse> {
		const messagesService = useMessagesService(this.serviceConfig);
		const to = {
			contact: {
				sub: this.sub,
				iss: this.iss,
			},
		};

		if (images) {
			return messagesService.sendImageMessage({
				files: images,
				body,
				sendId,
				to,
			});
		}

		if (documents) {
			return messagesService.sendDocumentMessage({
				files: documents,
				body,
				sendId,
				to,
			});
		}

		return messagesService.sendTextMessage({
			body: body ?? '',
			sendId,
			to,
		});
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
