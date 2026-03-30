import {ConnectedPayload} from './ConnectedPayload';
import {DisconnectedPayload} from './DisconnectedPayload';
import {WsMessage} from './WsMessage';
import {WsThread} from './WsThread';
import {AckPayload} from './AckPayload';
import {ErrorPayload} from './ErrorPayload';
import {PingPayload} from './PingPayload';
interface EventPayload {
  connectedEvent?: ConnectedPayload;
  disconnectedEvent?: DisconnectedPayload;
  messageEvent?: WsMessage;
  threadCreatedEvent?: WsThread;
  ackEvent?: AckPayload;
  errorEvent?: ErrorPayload;
  pingEvent?: PingPayload;
  additionalProperties?: Map<string, any>;
}
export { EventPayload };