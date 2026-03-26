import type { ServiceConfig } from '../../configs';
import {
	type MessageHistorySearchParams,
	type MessageSendTextParams,
	useMessagesService,
} from '../../messages';
import type { IThread, ThreadModel } from '../types/Thread.types';

class Thread implements IThread {
	private readonly _serviceConfig: ServiceConfig;
	id!: string;

	constructor(
		rawThread: ThreadModel,
		{
			serviceConfig,
		}: {
			serviceConfig: ServiceConfig;
		},
	) {
		Object.assign(this, rawThread);
		this._serviceConfig = serviceConfig;
	}

	async fetchMessageHistory(params?: MessageHistorySearchParams) {
		return useMessagesService(this.serviceConfig).fetchMessageHistory(
			this.id,
			params,
		);
	}

	async sendTextMessage(
		body: string,
		params: Omit<MessageSendTextParams, 'body' | 'to'> = {},
	) {
		return useMessagesService(this.serviceConfig).sendTextMessage({
			...params,
			body,
			to: {
				threadId: this.id,
			},
		});
	}

	get serviceConfig(): ServiceConfig {
		return this._serviceConfig;
	}
}

export function createThread(
	rawThread: ThreadModel,
	{
		serviceConfig,
	}: {
		serviceConfig: ServiceConfig;
	},
): IThread {
	return new Thread(rawThread, {
		serviceConfig,
	});
}
