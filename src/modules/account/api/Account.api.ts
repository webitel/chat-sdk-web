import {
	applyTransform,
	snakeToCamel,
} from '@webitel/api-services/api/transformers';

import type { ServiceConfig } from '../../configs';
import type { AccountModel } from '../types/Account.types';

/**
 * Current authorization / user context: `GET /v1/auth/token`
 * Uses credentials on the configured `axiosInstance` (e.g. Bearer token).
 */
export const getAccountService = ({ axiosInstance }: ServiceConfig) => {
	return {
		getAccount: async (): Promise<AccountModel> => {
			const response = await axiosInstance.get('/v1/auth/token');
			return applyTransform(response.data, [
				snakeToCamel(),
			]);
		},
	};
};
