import axios, { type AxiosInstance } from 'axios';
import * as qs from 'qs-esm';

import type { Config } from '../types/Config.types';
export interface ServiceConfigInputSchema extends Config {
	baseUrl: string;
}

export class ServiceConfig implements ServiceConfigInputSchema {
	baseUrl;
	accessToken;

	axiosInstance: AxiosInstance;

	constructor({ baseUrl, accessToken }: ServiceConfigInputSchema) {
		this.baseUrl = baseUrl;
		this.accessToken = accessToken;

		this.axiosInstance = axios.create({
			baseURL: this.baseUrl,
			paramsSerializer: (params) =>
				qs.stringify(params, {
					allowDots: true,
					arrayFormat: 'repeat',
				}),
		});

		this.setupAxiosTokenHandler();
	}

	setupAxiosTokenHandler() {
		if (typeof this.accessToken === 'function') {
			this.axiosInstance.interceptors.request.use(async (config) => {
				config.headers['X-Webitel-Access'] = await (
					this.accessToken as () => string
				)();
				return config;
			});
		} else {
			this.axiosInstance.defaults.headers.common['X-Webitel-Access'] =
				this.accessToken;
		}
	}
}

export function createServiceConfig(
	rawServiceConfig: ServiceConfigInputSchema,
): ServiceConfig {
	return new ServiceConfig(rawServiceConfig);
}
