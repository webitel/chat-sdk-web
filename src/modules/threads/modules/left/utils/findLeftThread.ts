import type { ServiceConfig } from '../../../../configs';
import type { ILeftThread } from '../types/LeftThread.types';
import { searchLeft } from './searchLeft';

const FIND_PAGE_SIZE = 100;

/**
 * The backend has no "get one left thread" call, so pages through the left
 * threads until it finds `threadId`; `null` when the caller never left it.
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
			hasNext = next;
			page += 1;
		}

		return null;
	};

export { findLeftThread };
