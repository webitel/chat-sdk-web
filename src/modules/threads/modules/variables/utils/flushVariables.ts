import type { ServiceConfig } from '../../../../configs';
import { getThreadVariablesService } from '../api/ThreadVariables.api';
import type {
	ThreadFlushVariablesParams,
	ThreadVariablesResponse,
} from '../types/ThreadVariable.types';

const flushVariables =
	(config: ServiceConfig) =>
	async (
		threadId: string,
		params: ThreadFlushVariablesParams,
	): Promise<ThreadVariablesResponse> =>
		getThreadVariablesService(config).flushVariables(threadId, params);

export { flushVariables };
