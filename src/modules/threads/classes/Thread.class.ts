import type { ServiceConfig } from '../../configs';
import {
	type MessageHistorySearchParams,
	useMessagesService,
} from '../../messages';
import type {
	IThread,
	ThreadModel,
	ThreadSendMessageParams,
	ThreadSendMessageResponse,
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

	async sendMessage({
		body,
		documents,
		images,
		sendId,
	}: ThreadSendMessageParams): Promise<ThreadSendMessageResponse> {
		const messagesService = useMessagesService(this.serviceConfig);
		const to = {
			threadId: this.id,
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
