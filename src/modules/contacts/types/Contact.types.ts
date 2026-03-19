import type {
    WebitelImApiGatewayV1Contact as ContactModel,
} from '@webitel/api-services/gen/models';

export interface IContact extends ContactModel {
    sendMessage: () => {}; // todo
}

export type {
    ContactModel,
}