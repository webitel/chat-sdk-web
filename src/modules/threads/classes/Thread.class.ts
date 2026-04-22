import type { ServiceConfig } from '../../configs';
import {
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
	IThreadMember,
	ThreadAddMemberParams,
	ThreadModel,
	ThreadRemoveMemberParams,
} from '../types/Thread.types';

class Thread implements IThread {
	private readonly _serviceConfig: ServiceConfig;
	id!: string;
	members: IThreadMember[] = [];

	constructor(
		rawThread: ThreadModel & {
			members: IThreadMember[];
		},
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
		{ body, attachments }: MessageSendParams,
		{ sendId }: MessageSendOptions = {},
	): Promise<MessageSendResponse> {
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

	async addMember(params: ThreadAddMemberParams) {
		return addMember(this.serviceConfig)(this.id, params);
	}

	async removeMember(params: ThreadRemoveMemberParams) {
		return removeMember(this.serviceConfig)(this.id, params);
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
	const members = (rawThread.members ?? []).map((rawMember) =>
		createThreadMember(rawMember, {
			serviceConfig,
			threadId: rawThread.id,
		}),
	);
	return new Thread(
		{
			...rawThread,
			members,
		},
		{
			serviceConfig,
		},
	);
}
