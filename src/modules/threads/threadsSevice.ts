import type { ServiceConfig } from '../configs';
import { fetchThreads } from './utils/fetchThreads';

export function useThreadsService(config: ServiceConfig) {
  return {
    fetchThreads: () => fetchThreads(config),
  };
}

