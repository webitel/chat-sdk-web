import type { ServiceConfig } from '../../configs';
import { type MessageSendTextParams, useMessagesService } from '../../messages';
import type { ContactModel, IContact } from '../types/Contact.types';

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

	async sendTextMessage(
		body: string,
		params: Omit<MessageSendTextParams, 'body' | 'to'> = {},
	) {
		return useMessagesService(this.serviceConfig).sendTextMessage({
			...params,
			body,
			to: {
				contact: {
					sub: this.sub,
					iss: this.iss,
				},
			},
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
