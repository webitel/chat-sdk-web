export {
    useThreadsService, // fetch + instantiate threads (service wrapper)
    type ThreadModel, // Thread backend response type 
    type IThread, // Thread class
    type ThreadSearchParams,
    type ThreadSearchResult,
 } from './modules/threads';

export {
    useContactsService, // fetch + instantiate contacts
    type ContactModel, // Contact backend response type
    type IContact, // Contact class
    type ContactSearchParams,
    type ContactSearchResult,
 } from './modules/contacts';

export {
    useMessagesService, // fetch + instantiate messages (service wrapper)
    type MessageModel, // Message backend response type
    type IMessage, // Message class
    type MessageHistorySearchParams,
    type MessageHistorySearchResult,
 } from './modules/messages';

 export {  
    // service configs
    createServiceConfig, 
    type ServiceConfigInputSchema, 
    type ServiceConfig,

    // socket configs
    createSocketConfig,
    type SocketConfigInputSchema, 
    type SocketConfig,
 } from './modules/configs';

export {
    createChatsSocketClient,

    ChatsSocketMessage, // enum for socket message types
} from './modules/socket';
