export {
	type AccountModel, // current auth / user payload from GET /v1/auth/token
	useAccountService,
} from './modules/account';
export {
	// service configs
	createServiceConfig,
	// socket configs
	createSocketConfig,
	type ServiceConfig,
	type ServiceConfigInputSchema,
	type SocketConfig,
	type SocketConfigInputSchema,
} from './modules/configs';

export {
	type ContactModel, // Contact backend response type
	type ContactSearchParams,
	type ContactSearchResult,
	type IContact, // Contact class
	useContactsService, // fetch + instantiate contacts
} from './modules/contacts';

export {
	type IMessage, // Message class
	type MessageHistorySearchParams,
	type MessageHistorySearchResult,
	type MessageModel, // Message backend response type
	// type MessageSendTextParams,
	useMessagesService, // fetch + instantiate messages (service wrapper)
} from './modules/messages';
export {
	ChatsSocketMessage, // enum for socket message types
	createChatsSocketClient,
} from './modules/socket';
export {
	type IThread, // Thread class
	type ThreadModel, // Thread backend response type
	type ThreadSearchParams,
	type ThreadSearchResult,
	useThreadsService, // fetch + instantiate threads (service wrapper)
} from './modules/threads';
