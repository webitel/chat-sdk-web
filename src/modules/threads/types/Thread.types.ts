import type {
    WebitelImApiGatewayV1Thread as ThreadModel,
} from '@webitel/api-services/gen/models';

import type { ServiceConfig } from '../../configs';
import type { IMessage } from '../../messages/types/Message.types';

export interface IThread extends ThreadModel {
    fetchMessageHistory: (config: ServiceConfig) => Promise<IMessage[]>;
}

export type {
    ThreadModel,
};
