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
	createContactsService, // fetch + instantiate contacts
	type IContact, // Contact class
} from './modules/contacts';

export {
	// type MessageSendTextParams,
	createMessagesService, // fetch + instantiate messages (service wrapper)
	type IMessage, // Message class
	MessageAttachmentType, // enum for message attachment kinds
	type MessageHistorySearchParams,
	type MessageHistorySearchResult,
	type MessageModel, // Message backend response type
} from './modules/messages';
export {
	ChatsSocketConnectionStatus,
	ChatsSocketMessage, // enum for socket message types
	createChatsSocketClient,
	type SocketMemberAddedEventPayload,
	type SocketMemberLeftEventPayload,
	// type SocketMessageModel,
	// type SocketThreadModel,
	// type SocketContactModel,
} from './modules/socket';
export {
	createThreadsService, // fetch + instantiate threads (service wrapper)
	type IThread, // Thread class
	type IThreadMember, // ThreadMember class
	type ThreadAddMemberParams,
	type ThreadFlushVariablesParams,
	type ThreadMemberModel,
	ThreadMemberRole, // enum for thread member roles
	type ThreadModel, // Thread backend response type
	type ThreadRemoveMemberParams,
	type ThreadSearchParams,
	type ThreadSearchResult,
	type ThreadSearchVariablesParams,
	type ThreadSearchVariablesResponse,
	type ThreadSetVariablesParams,
	type ThreadTransferParams,
	type ThreadVariablesModel,
	type ThreadVariablesResponse,
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
