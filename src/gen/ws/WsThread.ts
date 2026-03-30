import {WsPeer} from './WsPeer';
interface WsThread {
  id?: string;
  domainId?: number;
  createdAt?: number;
  subject?: string;
  reservedType?: string;
  members?: WsPeer[];
  additionalProperties?: Map<string, any>;
}
export { WsThread };