import type {
    // @ts-ignore
    WebitelImApiGatewayV1Thread as ThreadModel,
} from '@webitel/api-services/gen/models';

export interface IThread extends ThreadModel {
    fetchMessageHistory: () => Promise<{}>;
}

export type {
    ThreadModel,
}
