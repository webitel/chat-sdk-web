import type {
    ThreadManagementSearchParams as ThreadSearchParams,
    WebitelImApiGatewayV1Thread as ThreadModel,
} from '@webitel/api-services/gen/models';

import type { ServiceConfigurable } from '../../configs';
import type { MessageHistorySearchResult, MessageHistorySearchParams } from '../../messages/types/Message.types';

interface IThread extends ThreadModel, ServiceConfigurable {
    id: string;

    fetchMessageHistory: (
        params?: MessageHistorySearchParams,
    ) => Promise<MessageHistorySearchResult>;
}

export type {
    ThreadModel,
    IThread,
    ThreadSearchParams,
};
