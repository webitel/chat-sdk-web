import axios, { type AxiosInstance } from 'axios';
import * as qs from 'qs-esm';


export type ServiceConfigInputSchema = {
    baseUrl: string;
    accessToken: string | (() => string) | (() => Promise<string>);
};

export class ServiceConfig implements ServiceConfigInputSchema {
    baseUrl: string;
    accessToken: string | (() => string) | (() => Promise<string>);

    axiosInstance: AxiosInstance;

    constructor({
        baseUrl,
        accessToken,
    }: ServiceConfigInputSchema) {
        this.baseUrl = baseUrl;
        this.accessToken = accessToken;

        this.axiosInstance = axios.create({
            baseURL: this.baseUrl,
            paramsSerializer: (params) =>
                qs.stringify(params, { allowDots: true })
        });

        this.setupAxiosTokenHandler();
    }

    setupAxiosTokenHandler() {
        if (typeof this.accessToken === 'function') {
            this.axiosInstance.interceptors.request.use(async (config) => {
                config.headers['X-Webitel-Access'] = await (this.accessToken as () => string)();
                return config;
            });
        } else {
            this.axiosInstance.defaults.headers.common['X-Webitel-Access'] = this.accessToken;
        }
    }
}

export function createServiceConfig(rawServiceConfig: ServiceConfigInputSchema): ServiceConfig {
    return new ServiceConfig(rawServiceConfig);
} 