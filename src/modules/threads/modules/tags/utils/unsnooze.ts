import type { ServiceConfig } from '../../../../configs';
import { getThreadTagsService } from '../api/ThreadTags.api';

/** Raw `DELETE /v1/threads/{threadId}/snooze` */
const unsnooze =
	(config: ServiceConfig) =>
	async (threadId: string): Promise<void> =>
		getThreadTagsService(config).unsnooze(threadId);

export { unsnooze };
