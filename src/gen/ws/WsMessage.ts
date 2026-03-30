import {WsPeer} from './WsPeer';
interface WsMessage {
  id?: string;
  sendId?: string;
  threadId?: string;
  reservedFrom?: WsPeer;
  to?: WsPeer;
  createdAt?: number;
  editedAt?: number;
  reservedText?: string;
  reservedType?: string;
  content?: Map<string, any>;
  additionalProperties?: Map<string, any>;
}
export { WsMessage };