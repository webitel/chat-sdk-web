export {
	type AccountModel, // current auth / user payload from GET /v1/auth/token
	createAccountService,
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
	createContactsService, // fetch + instantiate contacts
} from './modules/contacts';

export {
	type IMessage, // Message class
	MessageAttachmentType, // enum for message attachment kinds
	type MessageHistorySearchParams,
	type MessageHistorySearchResult,
	type MessageModel, // Message backend response type
	// type MessageSendTextParams,
	createMessagesService, // fetch + instantiate messages (service wrapper)
} from './modules/messages';
export {
	ChatsSocketConnectionStatus,
	ChatsSocketMessage, // enum for socket message types
	createChatsSocketClient,
	// type SocketMessageModel,
	// type SocketThreadModel,
	// type SocketContactModel,
} from './modules/socket';
export {
	type IThread, // Thread class
	type IThreadMember, // ThreadMember class
	type ThreadAddMemberParams,
	type ThreadMemberModel,
	ThreadMemberRole, // enum for thread member roles
	type ThreadModel, // Thread backend response type
	type ThreadRemoveMemberParams,
	type ThreadSearchParams,
	type ThreadSearchResult,
	createThreadsService, // fetch + instantiate threads (service wrapper)
} from './modules/threads';

// custom-elements:

// export {
// 	defaultChatUiElements,
// 	registerChatUiCustomElements,
// 	WtChatAvatarElement,
// 	type WtChatAvatarProps,
// 	WtChatMessageBubbleElement,
// 	type WtChatMessageBubbleProps,
// } from './modules/ui';
