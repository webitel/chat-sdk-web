import type { ServiceConfig } from '../../../../configs';
import { getThreadTagsService } from '../api/ThreadTags.api';

/** Raw `POST /v1/threads/{threadId}/snooze` */
const snooze =
	(config: ServiceConfig) =>
	async (threadId: string): Promise<void> =>
		getThreadTagsService(config).snooze(threadId);

export { snooze };
