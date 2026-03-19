import type {
    WebitelImServiceThreadV1HistoryMessage as MessageModel,
} from '@webitel/api-services/gen/models';

export interface IMessage extends MessageModel {
    markRead: () => Promise<void>;
}

export type {
    MessageModel,
}