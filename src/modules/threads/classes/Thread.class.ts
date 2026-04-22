import type { ServiceConfig } from '../../configs';
import {
	type IMessagesService,
	type MessageHistorySearchParams,
	useMessagesService,
} from '../../messages';
import { MessageAttachmentType } from '../../messages/enums/MessageAttachmentType.enum';
import type {
	MessageSendOptions,
	MessageSendParams,
	MessageSendResponse,
} from '../../messages/types/Message.types';
import { createThreadMember } from '../modules/members/classes/ThreadMember.class';
import { addMember } from '../modules/members/utils/addMember';
import { removeMember } from '../modules/members/utils/removeMember';
import type {
	IThread,
	ThreadAddMemberParams,
	ThreadMemberModel,
	ThreadModel,
	ThreadRemoveMemberParams,
} from '../types/Thread.types';

class Thread implements IThread {
	private readonly _serviceConfig: ServiceConfig;
	private readonly _messagesService: IMessagesService;
	id;
	members;

	constructor(
		rawThread: ThreadModel,
		{
			serviceConfig,
		}: {
			serviceConfig: ServiceConfig;
		},
	) {
		this._serviceConfig = serviceConfig;
		this._messagesService = useMessagesService(serviceConfig);

		const { id, members, ...rest } = rawThread;
		Object.assign(this, rest);
		this.id = id;
		this.members = (members ?? []).map((rawMember) =>
			createThreadMember(rawMember as ThreadMemberModel, {
				serviceConfig,
				threadId: id,
			}),
		);
	}

	async fetchMessageHistory(params?: MessageHistorySearchParams) {
		return useMessagesService(this.serviceConfig).fetchMessageHistory(
			this.id,
			params,
		);
	}

	async sendMessage(
		{ body, attachments }: MessageSendParams,
		{ sendId }: MessageSendOptions = {},
	): Promise<MessageSendResponse> {
		const to = {
			threadId: this.id,
		};

		switch (attachments?.type) {
			case MessageAttachmentType.Images:
				return this.messagesService.sendImageMessage({
					files: attachments.files,
					body,
					sendId,
					to,
				});
			case MessageAttachmentType.Documents:
				return this.messagesService.sendDocumentMessage({
					files: attachments.files,
					body,
					sendId,
					to,
				});
			default:
				return this.messagesService.sendTextMessage({
					body: body ?? '',
					sendId,
					to,
				});
		}
	}

	async addMember(params: ThreadAddMemberParams) {
		return addMember(this.serviceConfig)(this.id, params);
	}

	async removeMember(params: ThreadRemoveMemberParams) {
		return removeMember(this.serviceConfig)(this.id, params);
	}

	get serviceConfig(): ServiceConfig {
		return this._serviceConfig;
	}

	get messagesService(): IMessagesService {
		return this._messagesService;
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
