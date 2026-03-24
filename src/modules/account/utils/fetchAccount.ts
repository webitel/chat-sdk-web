import type { ServiceConfig } from '../../configs';
import { getAccountService } from '../api/Account.api';
import type { AccountModel } from '../types/Account.types';

/**
 * Resolves current user / authorization payload for the token on `config`.
 */
export const fetchAccount = async (
	config: ServiceConfig,
): Promise<AccountModel> => {
	return getAccountService(config).getAccount();
};
