import type { ServiceConfig } from '../../configs';
import { getMessageHistory } from '../api/Messages.api';
import { createMessage } from '../classes/Message.class';
import type { MessageModel } from '../types/Message.types';

/**
 * Raw messages from `GET /v1/{threadId}/messages`
 * (`WebitelImApiGatewayV1SearchMessageHistoryResponse.messages`).
 */
const fetchRawMessageHistory = async (config: ServiceConfig, threadId: string) => {
    const response = await getMessageHistory(config, threadId);
    return response.messages ?? [];
};

const instantiateMessages = (rawMessages: MessageModel[]) => {
    return rawMessages.map((rawMessage) => createMessage(rawMessage));
};

/**
 * Fetches message history and returns `Message` class instances.
 * Requires `ServiceConfig` (same pattern as `fetchContacts` / `fetchThreads`).
 */
const fetchMessageHistory = async (config: ServiceConfig, threadId: string) => {
    const rawMessages = await fetchRawMessageHistory(config, threadId);
    return instantiateMessages(rawMessages);
};

export {
    fetchRawMessageHistory,
    fetchMessageHistory,
};
