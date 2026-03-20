import type {
    MessageHistorySearchThreadMessagesHistoryWebitelImApiGatewayV1MessageHistoryParams,
    WebitelImApiGatewayV1SearchMessageHistoryResponse,
    WebitelImApiGatewayV1Thread as ThreadModel,
} from '@webitel/api-services/gen/models';

import type { ServiceConfig } from '../../configs';
import type { IMessage } from '../../messages/types/Message.types';

/**
 * API response with `messages` replaced by instantiated SDK `Message` classes.
 */
export type ThreadMessageHistoryResult = Omit<WebitelImApiGatewayV1SearchMessageHistoryResponse, 'messages'> & {
    messages: IMessage[];
};

export interface IThread extends ThreadModel {
    fetchMessageHistory: (
        config: ServiceConfig,
        params?: MessageHistorySearchThreadMessagesHistoryWebitelImApiGatewayV1MessageHistoryParams,
    ) => Promise<ThreadMessageHistoryResult>;
}

export type {
    ThreadModel,
};
