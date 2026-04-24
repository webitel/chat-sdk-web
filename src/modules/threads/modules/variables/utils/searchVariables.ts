import type { ServiceConfig } from '../../../../configs';
import { getThreadVariablesService } from '../api/ThreadVariables.api';
import type {
	ThreadSearchVariablesParams,
	ThreadSearchVariablesResponse,
} from '../types/ThreadVariable.types';

/** Raw `GET /v1/variables` */
const searchVariables =
	(config: ServiceConfig) =>
	async (
		params?: ThreadSearchVariablesParams,
	): Promise<ThreadSearchVariablesResponse> =>
		getThreadVariablesService(config).searchVariables(params);

export { searchVariables };
