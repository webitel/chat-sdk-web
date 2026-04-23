import type { ServiceConfig } from '../configs';
import { fetchAccount } from './utils/fetchAccount';

export function createAccountService(config: ServiceConfig) {
	return {
		getAccount: () => fetchAccount(config),
	};
}
