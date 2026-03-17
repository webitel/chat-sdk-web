import {ConnectedPayload} from './ConnectedPayload';
import {DisconnectedPayload} from './DisconnectedPayload';
import {MessagePayload} from './MessagePayload';
import {ThreadPayload} from './ThreadPayload';
import {AckPayload} from './AckPayload';
import {ErrorPayload} from './ErrorPayload';
import {PingPayload} from './PingPayload';
class EventPayload {
  private _connected?: ConnectedPayload;
  private _disconnected?: DisconnectedPayload;
  private _message?: MessagePayload;
  private _threadCreated?: ThreadPayload;
  private _ack?: AckPayload;
  private _error?: ErrorPayload;
  private _ping?: PingPayload;
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    connected?: ConnectedPayload,
    disconnected?: DisconnectedPayload,
    message?: MessagePayload,
    threadCreated?: ThreadPayload,
    ack?: AckPayload,
    error?: ErrorPayload,
    ping?: PingPayload,
    additionalProperties?: Map<string, any>,
  }) {
    this._connected = input.connected;
    this._disconnected = input.disconnected;
    this._message = input.message;
    this._threadCreated = input.threadCreated;
    this._ack = input.ack;
    this._error = input.error;
    this._ping = input.ping;
    this._additionalProperties = input.additionalProperties;
  }

  get connected(): ConnectedPayload | undefined { return this._connected; }
  set connected(connected: ConnectedPayload | undefined) { this._connected = connected; }

  get disconnected(): DisconnectedPayload | undefined { return this._disconnected; }
  set disconnected(disconnected: DisconnectedPayload | undefined) { this._disconnected = disconnected; }

  get message(): MessagePayload | undefined { return this._message; }
  set message(message: MessagePayload | undefined) { this._message = message; }

  get threadCreated(): ThreadPayload | undefined { return this._threadCreated; }
  set threadCreated(threadCreated: ThreadPayload | undefined) { this._threadCreated = threadCreated; }

  get ack(): AckPayload | undefined { return this._ack; }
  set ack(ack: AckPayload | undefined) { this._ack = ack; }

  get error(): ErrorPayload | undefined { return this._error; }
  set error(error: ErrorPayload | undefined) { this._error = error; }

  get ping(): PingPayload | undefined { return this._ping; }
  set ping(ping: PingPayload | undefined) { this._ping = ping; }

  get additionalProperties(): Map<string, any> | undefined { return this._additionalProperties; }
  set additionalProperties(additionalProperties: Map<string, any> | undefined) { this._additionalProperties = additionalProperties; }
}
export { EventPayload };