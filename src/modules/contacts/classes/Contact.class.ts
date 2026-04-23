import type { ServiceConfig } from '../../configs';
import { createMessagesService, type IMessagesService } from '../../messages';
import type {
	MessageSendOptions,
	MessageSendParams,
	MessageSendResponse,
} from '../../messages/types/Message.types';
import { routeMessageSend } from '../../messages/utils/routeMessageSend';
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
		this._messagesService = createMessagesService(serviceConfig);

		const { sub, iss, ...rest } = rawContact;
		Object.assign(this, rest);
		this.sub = sub;
		this.iss = iss;
	}

	async sendMessage(
		params: MessageSendParams,
		options: MessageSendOptions = {},
	): Promise<MessageSendResponse> {
		return routeMessageSend(
			this.messagesService,
			{
				contact: {
					sub: this.sub,
					iss: this.iss,
				},
			},
			params,
			options,
		);
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
