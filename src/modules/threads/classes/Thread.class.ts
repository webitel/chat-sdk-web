import castArray from 'lodash/castArray';

import type { ServiceConfig } from '../../configs';
import {
	type MessageHistorySearchParams,
	useMessagesService,
} from '../../messages';
import type {
	IThread,
	ThreadModel,
	ThreadSendDocumentMessageParams,
	ThreadSendImageMessageParams,
	ThreadSendTextMessageParams,
} from '../types/Thread.types';

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
		params: ThreadSendTextMessageParams = {},
	) {
		return useMessagesService(this.serviceConfig).sendTextMessage({
			...params,
			body,
			to: {
				threadId: this.id,
			},
		});
	}

	async sendDocumentMessage(
		files: File | readonly File[],
		params: ThreadSendDocumentMessageParams = {},
	) {
		return useMessagesService(this.serviceConfig).sendDocumentMessage({
			...params,
			files: castArray(files),
			to: {
				threadId: this.id,
			},
		});
	}

	async sendImageMessage(
		files: File | readonly File[],
		params: ThreadSendImageMessageParams = {},
	) {
		return useMessagesService(this.serviceConfig).sendImageMessage({
			...params,
			files: castArray(files),
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
