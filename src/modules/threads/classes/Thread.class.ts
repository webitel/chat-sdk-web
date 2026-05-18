import type { ServiceConfig } from '../../configs';
import {
	createMessagesService,
	type IMessagesService,
	type MessageHistorySearchParams,
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
import { transfer } from '../modules/members/utils/transfer';
import type {
	ThreadFlushVariablesParams,
	ThreadSetVariablesParams,
} from '../modules/variables/types/ThreadVariable.types';
import { flushVariables } from '../modules/variables/utils/flushVariables';
import { locateVariables } from '../modules/variables/utils/locateVariables';
import { setVariables } from '../modules/variables/utils/setVariables';
import type {
	IThread,
	ThreadAddMemberParams,
	ThreadMemberModel,
	ThreadModel,
	ThreadRemoveMemberParams,
	ThreadTransferParams,
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
		return this.messagesService.fetchMessageHistory(this.id, params);
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

	async transfer(params: ThreadTransferParams) {
		return transfer(this.serviceConfig)(this.id, params);
	}

	async locateVariables() {
		return locateVariables(this.serviceConfig)(this.id);
	}

	async setVariables(params: ThreadSetVariablesParams) {
		return setVariables(this.serviceConfig)(this.id, params);
	}

	async flushVariables(params: ThreadFlushVariablesParams) {
		return flushVariables(this.serviceConfig)(this.id, params);
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
