import type { ServiceConfig } from '../../../../configs';
import { createContact } from '../../../../contacts/classes/Contact.class';
import type { ThreadModel } from '../../../types/Thread.types';
import type {
	IThreadMember,
	ThreadMemberModel,
	ThreadRemoveMemberResponse,
} from '../types/ThreadMember.types';
import { removeMember } from '../utils/removeMember';

class ThreadMember implements IThreadMember {
	private readonly _serviceConfig: ServiceConfig;
	private readonly _threadId: ThreadModel['id'];
	id;
	contact;

	constructor(
		rawMember: ThreadMemberModel,
		{
			serviceConfig,
			threadId,
		}: {
			serviceConfig: ServiceConfig;
			threadId: ThreadModel['id'];
		},
	) {
		this._serviceConfig = serviceConfig;
		this._threadId = threadId;

		const { id, contact, ...rest } = rawMember;
		Object.assign(this, rest);
		this.id = id;
		this.contact = createContact(contact, {
			serviceConfig,
		});
	}

	async removeFromThread(): Promise<ThreadRemoveMemberResponse> {
		return removeMember(this._serviceConfig)(this.threadId, {
			id: this.id,
		});
	}

	get threadId(): ThreadModel['id'] {
		return this._threadId;
	}
}

export function createThreadMember(
	rawMember: ThreadMemberModel,
	{
		serviceConfig,
		threadId,
	}: {
		serviceConfig: ServiceConfig;
		threadId: ThreadModel['id'];
	},
): IThreadMember {
	return new ThreadMember(rawMember, {
		serviceConfig,
		threadId,
	});
}
