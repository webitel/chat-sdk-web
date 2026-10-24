import type { ServiceConfig } from '../../../../configs';
import type { ILeftThread } from '../types/LeftThread.types';
import { searchLeft } from './searchLeft';

const FIND_PAGE_SIZE = 100;

/**
 * The backend has no "get one left thread" call, so pages through the left
 * threads until it finds `threadId`; `null` when the caller never left it.
 * An empty page ends the search even if the backend still says `next`, so a
 * misbehaving backend cannot keep it paging forever.
 */
const findLeftThread =
	(config: ServiceConfig) =>
	async (threadId: string): Promise<ILeftThread | null> => {
		let page = 1;
		let hasNext = true;

		while (hasNext) {
			const { items, next } = await searchLeft(config)({
				page,
				size: FIND_PAGE_SIZE,
			});
			const found = items.find((thread) => thread.id === threadId);
			if (found) return found;
			hasNext = next && items.length > 0;
			page += 1;
		}

		return null;
	};

export { findLeftThread };
