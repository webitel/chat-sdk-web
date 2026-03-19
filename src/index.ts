export { 
    fetchThreads, // fetch + instantiate threads
    type ThreadModel, // Thread backend response type
    type IThread, // Thread class
 } from './modules/threads';

export {
    useContactsService, // fetch + instantiate contacts
    type ContactModel, // Contact backend response type
    type IContact, // Contact class
 } from './modules/contacts';

export { 
    fetchMessageHistory, // fetch + instantiate messages
    type MessageModel, // Message backend response type
    type IMessage, // Message class
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
