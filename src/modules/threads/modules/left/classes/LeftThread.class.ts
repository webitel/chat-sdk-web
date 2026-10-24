import type { ServiceConfig } from '../../../../configs';
import {
	createMessagesService,
	type IMessagesService,
	type MessageHistorySearchParams,
} from '../../../../messages';
import type {
	ThreadMemberModel,
	ThreadModel,
} from '../../../types/Thread.types';
import type { ILeftThread } from '../types/LeftThread.types';

class LeftThread implements ILeftThread {
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
		this._messagesService = createMessagesService(serviceConfig);

		const { id, members, ...rest } = rawThread;
		Object.assign(this, rest);
		this.id = id;
		this.members = (members ?? []) as ThreadMemberModel[];
	}

	async fetchMessageHistory(params?: MessageHistorySearchParams) {
		return this._messagesService.fetchLeftThreadMessageHistory(this.id, params);
	}
}

export function createLeftThread(
	rawThread: ThreadModel,
	{
		serviceConfig,
	}: {
		serviceConfig: ServiceConfig;
	},
): ILeftThread {
	return new LeftThread(rawThread, {
		serviceConfig,
	});
}
