import type { ServiceConfig } from '../configs';
import type { ThreadSearchParams } from './types/Thread.types';
import { fetchThreads } from './utils/fetchThreads';

export function useThreadsService(config: ServiceConfig) {
	return {
		fetchThreads: (params?: ThreadSearchParams) =>
			fetchThreads(config, params ?? {}),
	};
}
