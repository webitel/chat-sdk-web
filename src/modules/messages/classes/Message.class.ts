import type { ServiceConfig } from '../../configs';
import {
	createMessagesService,
	type IMessagesService,
} from '../messagesService';
import type { IMessage, MessageModel } from '../types/Message.types';

class Message implements IMessage {
	private readonly _serviceConfig: ServiceConfig;
	private readonly _messagesService: IMessagesService;
	id;
	constructor(
		rawMessage: MessageModel,
		{
			serviceConfig,
		}: {
			serviceConfig: ServiceConfig;
		},
	) {
		this._serviceConfig = serviceConfig;
		this._messagesService = createMessagesService(serviceConfig);

		const { id, ...rest } = rawMessage;
		Object.assign(this, rest);
		this.id = id;
	}

	get serviceConfig(): ServiceConfig {
		return this._serviceConfig;
	}

	get messagesService(): IMessagesService {
		return this._messagesService;
	}

	async markRead() {
		throw new Error('Method not implemented.');
		// return this.messagesService.markRead(this.id);
	}
}

export function createMessage(
	rawMessage: MessageModel,
	{
		serviceConfig,
	}: {
		serviceConfig: ServiceConfig;
	},
): IMessage {
	return new Message(rawMessage, {
		serviceConfig,
	});
}
