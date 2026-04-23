import type { ServiceConfig } from '../../configs';
import {
	type IMessagesService,
	type MessageHistorySearchParams,
	createMessagesService,
} from '../../messages';
import type {
	MessageSendOptions,
	MessageSendParams,
	MessageSendResponse,
} from '../../messages/types/Message.types';
import { routeMessageSend } from '../../messages/utils/routeMessageSend';
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
		this._messagesService = createMessagesService(serviceConfig);

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
		return createMessagesService(this.serviceConfig).fetchMessageHistory(
			this.id,
			params,
		);
	}

	async sendMessage(
		params: MessageSendParams,
		options: MessageSendOptions = {},
	): Promise<MessageSendResponse> {
		return routeMessageSend(
			this.messagesService,
			{
				threadId: this.id,
			},
			params,
			options,
		);
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
