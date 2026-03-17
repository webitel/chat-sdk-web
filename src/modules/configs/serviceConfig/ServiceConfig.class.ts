import axios, { type AxiosInstance } from 'axios';

export type ServiceConfigSchema = {
    baseUrl: string;
    accessToken: string | (() => string) | (() => Promise<string>);
}

class ServiceConfig implements ServiceConfigSchema {
    baseUrl: string;
    accessToken: string | (() => string) | (() => Promise<string>);

    axiosInstance: AxiosInstance;

    constructor({
        baseUrl,
        accessToken,
    }: ServiceConfigSchema) {
        this.baseUrl = baseUrl;
        this.accessToken = accessToken;

        this.axiosInstance = axios.create({
            baseURL: this.baseUrl,
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

export function createServiceConfig(rawServiceConfig: ServiceConfigSchema): ServiceConfig {
    return new ServiceConfig(rawServiceConfig);
}