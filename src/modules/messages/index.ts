export { createMessage } from './classes/Message.class';
export { MessageAttachmentType } from './enums/MessageAttachmentType.enum';
export {
	createMessagesService,
	type IMessagesService,
} from './messagesService';
export type {
	IMessage,
	MessageHistorySearchParams,
	MessageHistorySearchResult,
	MessageModel,
} from './types/Message.types';
