import type { ServiceConfig } from '../configs';
import { fetchAccount } from './utils/fetchAccount';

export function useAccountService(config: ServiceConfig) {
	return {
		getAccount: () => fetchAccount(config),
	};
}
