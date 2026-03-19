import { getMessageHistory } from '../api/Messages.api';
import { createMessage } from '../classes/Message.class';
import type { MessageModel } from '../types/Message.types';

/**
 * no instantiation, only raw data
 */
const fetchRawMessageHistory = () => {
    return getMessageHistory();
}

const instantiateMessages = (rawMessages: MessageModel[]) => {
    return rawMessages.map((rawMessage) => createMessage(rawMessage));
};

const fetchMessageHistory = async () => {
    const rawMessages = await fetchRawMessageHistory();
    return instantiateMessages(rawMessages);
};

export {
    fetchRawMessageHistory,
    fetchMessageHistory,
};