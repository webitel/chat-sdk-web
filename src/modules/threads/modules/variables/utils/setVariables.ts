import type { ServiceConfig } from '../../../../configs';
import { getThreadVariablesService } from '../api/ThreadVariables.api';
import type {
	ThreadSetVariablesParams,
	ThreadVariablesResponse,
} from '../types/ThreadVariable.types';

const setVariables =
	(config: ServiceConfig) =>
	async (
		threadId: string,
		params: ThreadSetVariablesParams,
	): Promise<ThreadVariablesResponse> =>
		getThreadVariablesService(config).setVariables(threadId, params);

export { setVariables };
