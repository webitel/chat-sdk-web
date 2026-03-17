import type { MessageModel, IMessage } from '../types/Message.types';

class Message implements IMessage {
    constructor(rawMessage: MessageModel) {
        Object.assign(this, rawMessage);
    }

    async markRead(): Promise<void> {
        throw new Error('Method not implemented.');
    }
}

export function createMessage(rawMessage: MessageModel): Message {
    return new Message(rawMessage);
}