import type { ServiceConfig } from '../../../../configs';

interface IThreadTagsApiService {
	snooze: (threadId: string) => Promise<void>;
	unsnooze: (threadId: string) => Promise<void>;
}

/**
 * Snoozing is the caller's own `snoozed` tag on the thread; other members
 * do not see it. The backend clears it when anyone but the caller writes to
 * the thread, or when the caller leaves it.
 */
export const getThreadTagsService = ({
	axiosInstance,
}: ServiceConfig): IThreadTagsApiService => ({
	/** `POST /v1/threads/{threadId}/snooze`; succeeds when already snoozed */
	snooze: async (threadId: string): Promise<void> => {
		await axiosInstance.post(`/v1/threads/${threadId}/snooze`);
	},

	/** `DELETE /v1/threads/{threadId}/snooze`; succeeds when not snoozed */
	unsnooze: async (threadId: string): Promise<void> => {
		await axiosInstance.delete(`/v1/threads/${threadId}/snooze`);
	},
});
