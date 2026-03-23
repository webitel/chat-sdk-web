import type { ServiceConfig } from '../../configs';
import { getMessagesService } from '../api/Messages.api';
import { createMessage } from '../classes/Message.class';
import type { MessageHistorySearchParams, MessageHistorySearchResult, MessageModel } from '../types/Message.types';

const fetchRawMessageHistory = (config: ServiceConfig) => async (
    threadId: string,
    params: MessageHistorySearchParams = {},
) => {
    const response = await getMessagesService(config).getMessageHistory(threadId, params);
    return response;
};

const instantiateMessages = (rawMessages: MessageModel[]) => {
    return rawMessages.map((rawMessage) => createMessage(rawMessage));
};

/**
 * Fetches message history and returns `Message` class instances in `messages`.
 */
const fetchMessageHistory = async (
    config: ServiceConfig,
    threadId: string,
    params: MessageHistorySearchParams = {},
) : Promise<MessageHistorySearchResult> => {
    const rawResponse = await fetchRawMessageHistory(config)(threadId, params);
    return {
        ...rawResponse,
        messages: instantiateMessages(rawResponse.messages ?? []),
    };
};

export {
    fetchRawMessageHistory,
    fetchMessageHistory,
};
