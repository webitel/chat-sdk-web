import type { ServiceConfig } from '../../../../configs';
import { getThreadVariablesService } from '../api/ThreadVariables.api';
import type { ThreadVariablesResponse } from '../types/ThreadVariable.types';

const locateVariables =
	(config: ServiceConfig) =>
	async (threadId: string): Promise<ThreadVariablesResponse> =>
		getThreadVariablesService(config).locateVariables(threadId);

export { locateVariables };
