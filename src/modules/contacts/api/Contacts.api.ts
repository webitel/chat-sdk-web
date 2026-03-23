import {
	applyTransform,
	camelToSnake,
	snakeToCamel,
} from '@webitel/api-services/api/transformers';

import type { ServiceConfig } from '../../configs';
import type {
	ContactSearchParams,
	ContactSearchRawResult,
} from '../types/Contact.types';

export const getContactsService = ({ axiosInstance }: ServiceConfig) => {
	return {
		getContactsList: async (
			params: ContactSearchParams = {},
		): Promise<ContactSearchRawResult> => {
			const transformedParams = applyTransform(params, [
				camelToSnake(),
			]);

			const response = await axiosInstance.get('/v1/contacts', {
				params: transformedParams,
			});
			return applyTransform(response.data, [
				snakeToCamel(),
			]);
		},
	};
};
