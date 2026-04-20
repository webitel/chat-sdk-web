import type { ServiceConfig } from '../../configs';
import {
	type MessageHistorySearchParams,
	useMessagesService,
} from '../../messages';
import { MessageAttachmentType } from '../../messages/enums/MessageAttachmentType.enum';
import type {
	IThread,
	ThreadModel,
	ThreadSendMessageOptions,
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

	async sendMessage(
		{ body, attachments }: ThreadSendMessageParams,
		{ sendId }: ThreadSendMessageOptions = {},
	): Promise<ThreadSendMessageResponse> {
		const messagesService = useMessagesService(this.serviceConfig);
		const to = {
			threadId: this.id,
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
