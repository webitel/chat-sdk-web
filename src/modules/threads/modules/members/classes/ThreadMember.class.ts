import type { ServiceConfig } from '../../../../configs';
import { createContact } from '../../../../contacts/classes/Contact.class';
import type { IContact } from '../../../../contacts/types/Contact.types';
import type { IThread } from '../../../types/Thread.types';
import type {
	IThreadMember,
	ThreadMemberModel,
	ThreadRemoveMemberResponse,
} from '../types/ThreadMember.types';
import { removeMember } from '../utils/removeMember';

class ThreadMember implements IThreadMember {
	private readonly _serviceConfig: ServiceConfig;
	private readonly threadId: IThread['id'];
	id!: NonNullable<ThreadMemberModel['id']>;
	contact!: IContact;

	constructor(
		raw: ThreadMemberModel & {
			contact: IContact;
		},
		{
			serviceConfig,
			threadId,
		}: {
			serviceConfig: ServiceConfig;
			threadId: IThread['id'];
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
		threadId: IThread['id'];
	},
): IThreadMember {
	const contact = createContact(raw.contact, {
		serviceConfig,
	});
	return new ThreadMember(
		{
			...raw,
			contact,
		},
		{
			serviceConfig,
			threadId,
		},
	);
}
