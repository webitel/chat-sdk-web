import type { ServiceConfig } from '../configs';
import { fetchThreads } from './utils/fetchThreads';
import type { ThreadSearchParams } from './types/Thread.types';

export function useThreadsService(config: ServiceConfig) {
  return {
    fetchThreads: (params?: ThreadSearchParams) => fetchThreads(config, params ?? {}),
  };
}
