import type { ServiceConfig } from '../../configs';
import type { IMessage, MessageModel } from '../types/Message.types';

class Message implements IMessage {
	private readonly _serviceConfig: ServiceConfig;
	constructor(
		rawMessage: MessageModel,
		{
			serviceConfig,
		}: {
			serviceConfig: ServiceConfig;
		},
	) {
		Object.assign(this, rawMessage);
		this._serviceConfig = serviceConfig;
	}

	get serviceConfig(): ServiceConfig {
		return this._serviceConfig;
	}

	async markRead(): Promise<void> {
		throw new Error('Method not implemented.');
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
