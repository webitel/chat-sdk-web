import type { ThreadManagementSearchParams } from '@webitel/api-services/gen/models';

import type { ServiceConfig } from '../configs';
import { fetchThreads } from './utils/fetchThreads';

export function useThreadsService(config: ServiceConfig) {
  return {
    fetchThreads: (params?: ThreadManagementSearchParams) => fetchThreads(config, params ?? {}),
  };
}
