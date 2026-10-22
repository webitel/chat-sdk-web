/** Tags the backend gives meaning to; filter on them with `tags` / `excludeTags`. */
export const ThreadTag = {
	/** the caller's own: set by `snooze`, cleared by the backend */
	Snoozed: 'snoozed',
} as const;

export type ThreadTag = (typeof ThreadTag)[keyof typeof ThreadTag];
