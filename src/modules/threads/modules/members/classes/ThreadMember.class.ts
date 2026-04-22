import type { ServiceConfig } from '../../../../configs';
import type {
	IThreadMember,
	ThreadMemberModel,
	ThreadRemoveMemberResponse,
} from '../types/ThreadMember.types';
import { IThread } from '../../../types/Thread.types';
import { removeMember } from '../utils/removeMember';

class ThreadMember implements IThreadMember {
	private readonly _serviceConfig: ServiceConfig;
	private readonly threadId: NonNullable<IThread['id']>;
	id!: NonNullable<ThreadMemberModel['id']>;

	constructor(
		raw: ThreadMemberModel,
		{
			serviceConfig,
			threadId,
		}: {
			serviceConfig: ServiceConfig;
			threadId: NonNullable<IThread['id']>;
		},
	) {
		Object.assign(this, raw);
		this._serviceConfig = serviceConfig;
		this.threadId = threadId;
	}

	async removeFromThread(): Promise<ThreadRemoveMemberResponse> {
		return removeMember(this._serviceConfig)(this.threadId, {
			id: this.id,
		});
	}
}

export function createThreadMember(
	raw: ThreadMemberModel,
	{
		serviceConfig,
		threadId,
	}: {
		serviceConfig: ServiceConfig;
		threadId: string;
	},
): IThreadMember {
	return new ThreadMember(raw, {
		serviceConfig,
		threadId,
	});
}
