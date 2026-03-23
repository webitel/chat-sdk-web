import type { ServiceConfig } from '../serviceConfig/ServiceConfig.class';

export interface ServiceConfigurable {
	get serviceConfig(): ServiceConfig;
}
